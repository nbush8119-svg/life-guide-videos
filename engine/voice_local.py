"""本地逐句配音（Qwen3-TTS，MLX）：一个旁白音色贯穿全系列，逐句生成 + Qwen3-ASR 回听，读错自动重试。
用 audio-stack 的 Python 运行（build.sh 会自动处理）：
  voice_local.py design [候选数]        生成候选旁白音色 → voices/candidates/，逐个试听
  voice_local.py pick <编号>            选定音色 → voices/narrator.wav（全系列共用）
  voice_local.py ep episodes/ep03       逐句配音 → vo/lines/*.wav + vo/voice_report.txt
  voice_local.py ep episodes/ep03 --redo hook:0,belt:2   只重做指定句
改了口播稿再跑 ep，只会重做改过的句子。"""
import sys, os, re, json, gc, time, shutil, hashlib, difflib
from pathlib import Path
import numpy as np, soundfile as sf
import mlx.core as mx
from mlx_audio.tts.utils import load_model
from mlx_audio.stt import load as load_stt

ROOT = Path(__file__).resolve().parent.parent
STACK = Path(os.environ.get("AUDIO_STACK", Path.home()/"Documents/ChatGPT/kindle/audio-stack"))
M = STACK/"models"
VOICES = ROOT/"voices"
# 参考句：约 9 秒，覆盖平叙、数字、停顿，复刻音色更稳
REF_TEXT = "人这一辈子，大部分的坑，其实别人早就踩过了。花一点点时间，看看他们留下的记录，能少走很多弯路。"
INSTRUCT = ("中年男性，四十岁左右，标准普通话，嗓音低沉浑厚、有磁性，"
            "语速舒缓，吐字清晰，语气沉稳温暖、娓娓道来，像纪录片旁白，不夸张不播音腔。")
PASS = 0.92          # 回听相似度低于它就重试
TRIES = 4

# ---------------- 数字与单位 → 读法（只处理常见写法，所有改动都会写进报告） ----------------
D = "零一二三四五六七八九"
def int_zh(n):
    n = int(n)
    if n == 0: return "零"
    def g4(x):   # 0 < x < 10000
        s = ""; zero = False
        for u, v in (("千", 1000), ("百", 100), ("十", 10), ("", 1)):
            d = x // v % 10
            if d: s += ("零" if zero and s else "") + D[d] + u; zero = False
            elif s: zero = True
        return s
    out = ""; groups = [(n // 10**8, "亿"), (n // 10**4 % 10**4, "万"), (n % 10**4, "")]
    for q, u in groups:
        if not q: continue
        body = int_zh(q) if q >= 10**4 else g4(q)
        if out and q < 1000: out += "零"
        out += body + u
    if out.startswith("一十"): out = out[1:]
    if out[:2] in ("二千", "二万", "二亿"): out = "两" + out[1:]
    return out
def digits_zh(s): return "".join(D[int(c)] for c in s)
def num_zh(s):
    s = s.replace(",", "")
    if "." in s:
        a, b = s.split(".", 1); return int_zh(a) + "点" + digits_zh(b)
    return int_zh(s)
UNITS = {"mg": "毫克", "kg": "公斤", "km": "公里", "cm": "厘米", "mm": "毫米", "ml": "毫升", "g": "克", "m": "米",
         "h": "小时", "min": "分钟", "%": "", "℃": "摄氏度", "mmHg": "毫米汞柱"}
LIANG = "倍个次件条种年岁小时分钟天周月顿杯口位名人家本层项步点"
def to_spoken(text):
    t = text
    t = re.sub(r"(\d+(?:\.\d+)?)\s*%", lambda m: "百分之" + num_zh(m.group(1)), t)
    t = re.sub(r"(\d+(?:\.\d+)?)\s*‰", lambda m: "千分之" + num_zh(m.group(1)), t)
    t = re.sub(r"(?<!\d)(\d{1,2}):(\d{2})(?!\d)", lambda m: int_zh(m.group(1)) + "点" + ("零" if m.group(2) == "00" else int_zh(m.group(2)) + "分"), t)
    t = re.sub(r"(\d{4})\s*年", lambda m: digits_zh(m.group(1)) + "年", t)
    t = re.sub(r"(打|拨|拨打|电话|热线|号码|编号|邮编|尾号)\s*(\d{3,})", lambda m: m.group(1) + digits_zh(m.group(2)), t)  # 电话、编号逐位读
    for u in sorted(UNITS, key=len, reverse=True):
        if u == "%": continue
        t = re.sub(r"(\d)\s*" + re.escape(u) + r"(?![A-Za-z])", r"\g<1>" + UNITS[u], t)
    t = re.sub(r"(?<![\d.])2(?=\s*[" + LIANG + "])", "两", t)
    t = re.sub(r"\d+(?:,\d{3})*(?:\.\d+)?", lambda m: num_zh(m.group(0)), t)
    t = re.sub(r"\s+(?=[一-鿿])|(?<=[一-鿿])\s+", "", t)
    t = re.sub(r"\s*[（(]\s*", "，", t); t = re.sub(r"\s*[）)]\s*(?=[，。、；！？]|$)", "", t); t = re.sub(r"\s*[）)]\s*", "，", t)
    t = re.sub(r"[“”\"「」『』《》【】]", "", t)
    t = re.sub(r"([，、])[，、]+", r"\1", t)
    return t
clean = lambda s: re.sub(r"[^一-鿿A-Za-z0-9]", "", s)
def similar(a, b): return difflib.SequenceMatcher(None, clean(a), clean(b)).ratio()

# ---------------- 模型 ----------------
def to_np(results):
    clips, rate = [], 24000
    for r in results:
        clips.append(np.asarray(r.audio.astype(mx.float32)).reshape(-1)); rate = r.sample_rate
    return np.concatenate(clips), rate
def trim(a, sr, thr=0.008):
    nz = np.where(np.abs(a) > thr)[0]
    return a[max(0, nz[0] - int(.03*sr)): nz[-1] + int(.12*sr)] if len(nz) else a
def free(*objs):
    for o in objs: del o
    gc.collect(); mx.clear_cache()
_asr = None
def hear(path):
    global _asr
    if _asr is None: _asr = load_stt(str(M/"Qwen3-ASR-1.7B-8bit"))
    return _asr.generate(str(path), language="Chinese").text.strip()

def design(n=6):
    out = VOICES/"candidates"; out.mkdir(parents=True, exist_ok=True)
    model = load_model(str(M/"Qwen3-TTS-1.7B-VoiceDesign-bf16"))
    info = []
    for k in range(1, n+1):
        seed = 1000 + k; mx.random.seed(seed)
        a, sr = to_np(model.generate_voice_design(text=REF_TEXT, instruct=INSTRUCT, language="Chinese", max_tokens=600))
        a = trim(a, sr); p = out/f"cand_{k}.wav"; sf.write(p, a, sr, subtype="PCM_24")
        info.append({"k": k, "seed": seed, "dur": round(len(a)/sr, 2), "file": str(p)})
        print(f"候选 {k}：{len(a)/sr:.1f} 秒 → {p}", flush=True)
    free(model)
    for x in info:
        x["heard"] = hear(x["file"]); x["match"] = round(similar(REF_TEXT, x["heard"]), 3)
        print(f"候选 {x['k']} 回听 {x['match']:.2f}：{x['heard']}")
    json.dump({"ref_text": REF_TEXT, "instruct": INSTRUCT, "candidates": info}, open(out/"candidates.json", "w"), ensure_ascii=False, indent=1)
    print(f"\n逐个试听 {out}/cand_*.wav，选好后运行：./build.sh voice-pick <编号>")

def pick(k):
    c = json.load(open(VOICES/"candidates/candidates.json"))
    x = next(i for i in c["candidates"] if i["k"] == int(k))
    shutil.copy(x["file"], VOICES/"narrator.wav")
    json.dump({"ref_text": c["ref_text"], "instruct": c["instruct"], "seed": x["seed"], "picked": int(k),
               "date": time.strftime("%Y-%m-%d")}, open(VOICES/"narrator.json", "w"), ensure_ascii=False, indent=1)
    print(f"已选定候选 {k} 为全系列旁白音色 → voices/narrator.wav")

def episode(ep, redo=()):
    ep = Path(ep); d = json.load(open(ep/"script.json"))
    nar = VOICES/"narrator.json"
    if not nar.exists(): sys.exit("还没有选定旁白音色：先运行 ./build.sh voice-design，再 ./build.sh voice-pick <编号>")
    nar = json.load(open(nar)); ref = str(VOICES/"narrator.wav")
    lines = [(s["id"], i, l) for s in d["scenes"] for i, l in enumerate(s["lines"])]
    todo_bad = [f"{s}_{i}" for s, i, l in lines if "待写" in l or "【" in l]
    if todo_bad: sys.exit("口播稿还有【待写】，先写完：" + "、".join(todo_bad))
    outd = ep/"vo/lines"; outd.mkdir(parents=True, exist_ok=True)
    metaf = ep/"vo/lines/.meta.json"; meta = json.load(open(metaf)) if metaf.exists() else {}
    vkey = hashlib.md5(open(ref, "rb").read()).hexdigest()[:8]
    redo = set(redo)
    model = None; rep = []; t0 = time.time()
    for sid, i, txt in lines:
        key = f"{sid}_{i}"; spoken = to_spoken(txt); h = hashlib.md5((spoken + vkey).encode()).hexdigest()[:10]
        wav = outd/f"{key}.wav"
        if wav.exists() and meta.get(key, {}).get("hash") == h and f"{sid}:{i}" not in redo:
            m = meta[key]; rep.append(f"{key}\t{m['dur']:5.2f}s\t{m['match']:.2f}\t{m['heard']}\t(未改动)"); continue
        if model is None: model = load_model(str(M/"Qwen3-TTS-1.7B-Base-bf16"))
        best = None
        for k in range(TRIES):
            mx.random.seed(hash((key, k)) % 2**31)
            a, sr = to_np(model.generate(text=spoken, language="Chinese", ref_audio=ref, ref_text=nar["ref_text"],
                                         max_tokens=max(200, len(spoken)*12)))
            a = trim(a, sr); sf.write(wav, a, sr, subtype="PCM_24")
            heard = hear(wav); r = similar(spoken, heard)
            # 防止异常拖长/截断：中文正常语速约 3.5–6.5 字/秒
            cps = len(clean(spoken)) / max(len(a)/sr, .1); ok = r >= PASS and 2.8 <= cps <= 7.5
            if best is None or (ok, r) > (best[0], best[1]): best = (ok, r, a, sr, heard)
            if ok: break
            print(f"  {key} 第{k+1}次 回听{r:.2f} 语速{cps:.1f}字/秒，重试", flush=True)
        ok, r, a, sr, heard = best; sf.write(wav, a, sr, subtype="PCM_24")
        meta[key] = {"hash": h, "dur": round(len(a)/sr, 2), "match": round(r, 3), "heard": heard, "spoken": spoken}
        flag = ("" if ok else "\t⚠️ 请人工试听") + ("\t⚠️ 含未转换的符号或字母" if re.search(r"[A-Za-z/~^*&@#=+<>]", spoken) else "")
        note = f"\t[读作：{spoken}]" if spoken != re.sub(r"[“”\"「」『』（）()《》【】]", "", txt) else ""
        line = f"{key}\t{len(a)/sr:5.2f}s\t{r:.2f}\t{heard}{flag}{note}"; rep.append(line); print(line, flush=True)
        json.dump(meta, open(metaf, "w"), ensure_ascii=False, indent=1)
    keep = {f"{s}_{i}.wav" for s, i, _ in lines}
    stale = [p.name for p in outd.glob("*.wav") if p.name not in keep]
    if stale: rep.append("多余的旧句子（口播稿已删，可手动删除）：" + " ".join(stale))
    open(ep/"vo/voice_report.txt", "w").write("\n".join(rep) + "\n")
    bad = sum("⚠️" in x for x in rep)
    print(f"\n完成：{len(lines)} 句，用时 {time.time()-t0:.0f} 秒；需人工试听 {bad} 句。报告：{ep}/vo/voice_report.txt")

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if a[0] == "design": design(int(a[1]) if len(a) > 1 else 6)
    elif a[0] == "pick": pick(a[1])
    elif a[0] == "ep":
        redo = a[a.index("--redo")+1].split(",") if "--redo" in a else []
        episode(a[1], redo)
    elif a[0] == "say": print(to_spoken(" ".join(a[1:])))
    else: sys.exit(__doc__)
