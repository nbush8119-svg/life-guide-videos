"""把一整段配音（vo/take.*）按口播稿切成逐句 WAV，并用 SenseVoice 逐句回听核对。
用法：python3 engine/align.py episodes/ep01   → vo/lines/*.wav + vo/align_report.txt"""
import sys, os, json, re, difflib, subprocess, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from asr import transcribe
import glob
EP = sys.argv[1]; src = sorted(glob.glob(f"{EP}/vo/take.*"))[0]; outd = f"{EP}/vo/lines"; os.makedirs(outd, exist_ok=True)
TMP = f"{EP}/vo/.tmp"; os.makedirs(TMP, exist_ok=True)
subprocess.run(["ffmpeg","-y","-v","error","-i",src,"-ac","1","-ar","48000",f"{TMP}/take.wav"], check=True)
a, SR = sf.read(f"{TMP}/take.wav")
d = json.load(open(f"{EP}/script.json"))
lines = [(s["id"], i, l) for s in d["scenes"] for i, l in enumerate(s["lines"])]
clean = lambda s: re.sub(r"[^一-鿿A-Za-z0-9]", "", s)
# chunk at silences into <=25 s pieces
w = int(.02*SR); e = np.sqrt(np.convolve(a**2, np.ones(w)/w, "same")); thr = max(.004, np.percentile(e,30)*1.5)
sil = e < thr; cuts = [0]; last = 0
for i in range(0, len(a), int(.01*SR)):
    if sil[i] and i-last > 12*SR and np.all(sil[i:i+int(.15*SR)]): cuts.append(i); last = i
cuts.append(len(a))
hyp = []   # (char, time)
for c0, c1 in zip(cuts[:-1], cuts[1:]):
    sf.write(f"{TMP}/chunk.wav", a[c0:c1], SR)
    text, toks = transcribe(f"{TMP}/chunk.wav")
    for tok, ts in toks:
        for ch in clean(tok): hyp.append((ch, c0/SR + ts))
ref = "".join(clean(l[2]) for l in lines)
owner = []; [owner.extend([k]*len(clean(l[2]))) for k, l in enumerate(lines)]
sm = difflib.SequenceMatcher(None, ref, "".join(h[0] for h in hyp), autojunk=False)
first = {}; lastt = {}
for blk in sm.get_matching_blocks():
    for j in range(blk.size):
        k = owner[blk.a+j]; t = hyp[blk.b+j][1]
        first.setdefault(k, t); lastt[k] = t
starts = []
for k in range(len(lines)):
    starts.append(first.get(k))
# fill any missing by interpolation
for k in range(len(lines)):
    if starts[k] is None: starts[k] = (starts[k-1] + (starts[k+1] or starts[k-1]+2))/2
# snap each boundary to the quietest point within 0.6 s before the line's first recognised char
bounds = []
for k in range(len(lines)):
    t = starts[k]; i0 = max(0, int((t-.6)*SR)); i1 = max(i0+1, int((t+.05)*SR))
    j = i0 + int(np.argmin(e[i0:i1])); bounds.append(j)
bounds[0] = max(0, bounds[0]); bounds.append(len(a))
rep = []
for k, (sid, i, txt) in enumerate(lines):
    seg = a[bounds[k]:bounds[k+1]]
    # trim trailing silence
    nz = np.where(np.abs(seg) > .01)[0]
    if len(nz): seg = seg[max(0, nz[0]-480): nz[-1]+2400]
    sf.write(f"{outd}/{sid}_{i}.wav", seg, SR)
    heard, _ = transcribe(f"{outd}/{sid}_{i}.wav")
    r = difflib.SequenceMatcher(None, clean(txt), clean(heard)).ratio()
    rep.append(f"{sid}_{i}\t{len(seg)/SR:5.2f}s\t{r:.2f}\t{clean(heard)}")
open(f"{EP}/vo/align_report.txt","w").write("\n".join(rep)); print("\n".join(rep))
