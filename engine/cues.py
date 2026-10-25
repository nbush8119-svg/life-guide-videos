"""关键词落点：把 script.json 的 "cues"（例 {"alcohol:3": ["零"]}）换成绝对时间，写进 timeline.json 的 "cues"。
画面里的大数字砸下来、震屏和 boom 都对齐到配音真正说出这个词的那一刻。用法：python3 engine/cues.py episodes/ep02"""
import sys, os, json, re, numpy as np, soundfile as sf, soxr
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try: from asr import transcribe
except ImportError:   # 没装 sherpa-onnx 时用本地 Qwen3-ForcedAligner（audio-stack 环境）按原句逐字对齐
    from mlx_audio.stt import load as _load
    _AL = _load(os.path.join(os.environ.get("AUDIO_STACK", os.path.expanduser("~/Documents/ChatGPT/kindle/audio-stack")), "models/Qwen3-ForcedAligner-0.6B-8bit"))
    def transcribe(path, text=""):
        r = _AL.generate(audio=path, text=text, language="Chinese")
        return text, [(it.text, it.start_time) for it in r]
EP = sys.argv[1]; SR = 48000
d = json.load(open(f"{EP}/script.json")); tl = json.load(open(f"{EP}/timeline.json"))
cues = d.get("cues", {})
if not cues: sys.exit(0)
T0 = {(l["scene"], l["i"]): l["t0"] for l in tl["lines"]}
clean = lambda s: re.sub(r"[^一-鿿A-Za-z0-9]", "", s)
out = {}
for key, words in cues.items():
    sid, i = key.split(":"); i = int(i)
    p = f"{EP}/vo/lines_t/{sid}_{i}.wav"
    if not os.path.exists(p): p = f"{EP}/vo/lines/{sid}_{i}.wav"
    a, sr = sf.read(p, dtype="float32")
    if a.ndim > 1: a = a.mean(1)
    if sr != SR: a = soxr.resample(a, sr, SR)
    nz = np.where(np.abs(a) > 0.01)[0]; trim = max(0, nz[0]-480)/SR if len(nz) else 0
    ref_line = d["scenes"][[s["id"] for s in d["scenes"]].index(sid)]["lines"][i]
    _, toks = transcribe(p, ref_line) if transcribe.__code__.co_argcount > 1 else transcribe(p)
    chars = []; [chars.extend((c, ts) for c in clean(tok)) for tok, ts in toks]
    hyp = "".join(c for c, _ in chars)
    for w in words:
        k = hyp.find(clean(w))
        if k < 0:   # 识别有同音字偏差时，退回按字数比例估计
            ref = clean(d["scenes"][[s["id"] for s in d["scenes"]].index(sid)]["lines"][i]); k2 = ref.find(clean(w))
            t = T0[(sid, i)] + (chars[-1][1]-trim) * (k2/len(ref)) if k2 >= 0 and chars else None
            print(f"  ! {key} 「{w}」未在识别结果中找到，按比例估计"); 
        else: t = T0[(sid, i)] + chars[k][1] - trim
        if t is not None: out[f"{key}:{w}"] = round(t, 3); print(f"{key}:{w}\t{t:.2f}")
tl["cues"] = out; json.dump(tl, open(f"{EP}/timeline.json", "w"), ensure_ascii=False, indent=1)
