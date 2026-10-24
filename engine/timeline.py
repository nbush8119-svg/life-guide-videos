"""把逐句配音拼成一条音轨，生成 timeline.json（画面、字幕、混音共用的唯一时间线）。
用法：python3 engine/timeline.py episodes/ep01"""
import json, sys, os, subprocess, numpy as np, soundfile as sf, soxr
EP = sys.argv[1]; SR = 48000
LINE_GAP, SCENE_GAP, LEAD, TAIL = 0.32, 0.95, 0.9, 4.2
d = json.load(open(f"{EP}/script.json"))
TEMPO = float(d.get("tempo", 1.0))   # 例 1.1：逐句用 atempo（WSOLA，适合人声）提速，不变调
def line_wav(sid, i):
    src = f"{EP}/vo/lines/{sid}_{i}.wav"
    if abs(TEMPO - 1) < 1e-3: return src
    os.makedirs(f"{EP}/vo/lines_t", exist_ok=True); dst = f"{EP}/vo/lines_t/{sid}_{i}.wav"
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af",
                        f"atempo={TEMPO}", dst], check=True)
    return dst
SPECIAL = {(k.split(":")[0], int(k.split(":")[1])): v for k, v in d.get("breaths", {}).items()}  # 例 {"smoke:3": 0.75}
t = LEAD; tracks = []; scenes = []; lines = []
for si, s in enumerate(d["scenes"]):
    if si: t += SCENE_GAP
    s0 = t - (LEAD if si == 0 else SCENE_GAP * 0.55)
    for i, txt in enumerate(s["lines"]):
        a, sr = sf.read(line_wav(s['id'], i), dtype="float32")
        if a.ndim > 1: a = a.mean(1)
        if sr != SR: a = soxr.resample(a, sr, SR)
        nz = np.where(np.abs(a) > 0.01)[0]
        if len(nz): a = a[max(0, nz[0]-480): nz[-1]+2400]
        if i: t += LINE_GAP
        t += SPECIAL.get((s["id"], i), 0)
        tracks.append((t, a))
        lines.append({"scene": s["id"], "i": i, "text": txt, "sub": s["subs"][i], "t0": round(t, 3), "t1": round(t + len(a)/SR, 3)})
        t += len(a)/SR
    scenes.append({"id": s["id"], "t0": round(max(0, s0), 3)})
dur = t + TAIL
for k in range(len(scenes)):
    scenes[k]["t1"] = scenes[k+1]["t0"] if k+1 < len(scenes) else round(dur, 3)
os.makedirs(f"{EP}/out", exist_ok=True)
vo = np.zeros(int(dur*SR)+SR, np.float32)
for t0, a in tracks:
    i = int(t0*SR); vo[i:i+len(a)] += a
sf.write(f"{EP}/out/vo.wav", vo, SR)
json.dump({"ep": d["ep"], "title": d["title"], "next": d.get("next",""), "items": d.get("items", {}), "cover": d.get("cover", {}), "dur": round(dur, 3), "scenes": scenes, "lines": lines},
          open(f"{EP}/timeline.json", "w"), ensure_ascii=False, indent=1)
print(f"时长 {dur:.1f}s，{len(lines)} 句，{len(scenes)} 段")
