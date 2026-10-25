"""配乐（D 小调暖色铺底 + 心跳）、程序化音效、人声压缩与闪避 → out/mix.wav。用法：python3 engine/mix.py episodes/ep01"""
import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000
import sys
EP = sys.argv[1]
TL = json.load(open(f"{EP}/timeline.json")); EV = json.load(open(f"{EP}/out/events.json"))
SND = json.load(open(f"{EP}/script.json")).get("sound", {})   # 每集声音设计：强心跳段落、静默点
DUR = TL["dur"]; N = int(DUR*SR) + SR
rng = np.random.default_rng(7)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def env(n, a, r):
    e = np.ones(n); A = int(a*SR); R = int(r*SR)
    if A: e[:A] = np.linspace(0, 1, A)
    if R: e[-R:] *= np.linspace(1, 0, R)
    return e
def add(buf, x, t, g=1.0, pan=0.0):
    i = int(t*SR); n = min(len(x), len(buf)-i)
    if n <= 0: return
    buf[i:i+n, 0] += x[:n]*g*np.sqrt((1-pan)/2)*1.414
    buf[i:i+n, 1] += x[:n]*g*np.sqrt((1+pan)/2)*1.414
mtof = lambda m: 440*2**((m-69)/12)

# ---------------- score: warm pad, D minor, 64 bpm ----------------
BPM = 64; beat = 60/BPM; bar = 4*beat
prog = [[50,57,62,65,69],[46,53,58,62,69],[41,53,57,60,65],[48,55,60,62,67]]   # Dm9  Bbmaj7  F  Csus
music = np.zeros((N, 2))
# 有 out/bgm.wav（engine/music_local.py 生成的 AI 配乐）就用它当铺底，跳过代码合成的和弦与低音；心跳、音效照旧
import os, soxr
BGM = os.path.exists(f"{EP}/out/bgm.wav") and not json.load(open(f"{EP}/script.json")).get("music", {}).get("off")
def padnote(m, dur):
    n = int(dur*SR); tt = np.arange(n)/SR; f = mtof(m); x = np.zeros(n)
    for d in (-0.07, 0.0, 0.06):
        ff = f*2**(d/12)
        for h in range(1, 7): x += np.sin(2*np.pi*ff*h*tt + h*1.3) / (h**1.6)
    x = lp(x, 1400)
    return x*env(n, 1.8, 2.4)/12
t = 0.0 if not BGM else DUR; k = 0
while t < DUR:
    for m in prog[k % 4]:
        if m < 48: m += 12
        add(music, padnote(m, 2*bar + 1.5), t, 0.55, pan=((m % 5)-2)/4)
    t += 2*bar; k += 1
# soft bass under it
t = 0.0 if not BGM else DUR; k = 0
while t < DUR:
    root = prog[k % 4][0] - 12; n = int(2*bar*SR); tt = np.arange(n)/SR
    x = (np.sin(2*np.pi*mtof(root)*tt) + 0.35*np.sin(2*np.pi*mtof(root)*2*tt) + 0.15*np.sin(2*np.pi*mtof(root)*3*tt))*env(n, 0.8, 1.5)
    add(music, x, t, 0.10); t += 2*bar; k += 1
# heartbeat (lub-dub) : strong in hook / bp / end, faint elsewhere
def heartbeat():
    n = int(0.5*SR); tt = np.arange(n)/SR; x = np.zeros(n)
    for off, g in ((0, 1.0), (0.24, 0.6)):
        i = int(off*SR); m = n - i; u = np.arange(m)/SR
        f = 58*np.exp(-u*9) + 38
        x[i:] += g*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-u*16)
    return lp(x, 180)
HB = heartbeat()
sc = {s["id"]: s for s in TL["scenes"]}
t = 0.0
while t < DUR:
    s = [x for x in TL["scenes"] if x["t0"] <= t][-1]["id"]
    g = 0.55 if s in SND.get("heartbeat", ["hook"]) else (0.5 if t > DUR-6 else 0.16)
    add(music, HB, t, g); t += beat
# glass plucks on each item's arrival (pentatonic D)
pent = [74, 76, 79, 81, 84, 86]
for i, s in enumerate([x for x in TL["scenes"] if x["id"] not in ("hook","outro")]):
    n = int(1.6*SR); tt = np.arange(n)/SR; f = mtof(pent[i % len(pent)])
    x = (np.sin(2*np.pi*f*tt) + 0.3*np.sin(2*np.pi*f*2.01*tt))*np.exp(-tt*3.2)
    add(music, x, s["t0"]+0.85, 0.16, pan=0.3*(-1)**i)

if BGM:
    b, bsr = sf.read(f"{EP}/out/bgm.wav", dtype="float64")
    if b.ndim == 1: b = np.stack([b, b], 1)
    if bsr != SR: b = soxr.resample(b, bsr, SR)
    b = b[:N] if len(b) >= N else np.pad(b, ((0, N-len(b)), (0, 0)))
    b = hp(b.T, 40).T                                                  # 去掉次低频，给人声和心跳让位
    fi, fo = int(1.5*SR), int(3.5*SR); end = int(DUR*SR)
    b[:fi] *= np.linspace(0, 1, fi)[:, None]                           # 开头渐入
    b[end-fo:end] *= np.linspace(1, 0, fo)[:, None]; b[end:] = 0       # 片尾渐出
    hb_rms = np.sqrt(np.mean(music**2)) + 1e-9
    b *= hb_rms / (np.sqrt(np.mean(b[:end]**2)) + 1e-9) * float(SND.get("bgm_gain", 2.2))   # 铺底比心跳层高约 7 dB
    music += b
    print("配乐：AI 铺底 out/bgm.wav")

# ---------------- music automation: silences + duck under voice ----------------
vo, vsr = sf.read(f"{EP}/out/vo.wav", dtype="float64"); assert vsr == SR
vo = np.pad(vo, (0, max(0, N-len(vo))))[:N]
gain = np.ones(N)
def dip(t0, t1, depth, fade=0.25):
    a, b = int(t0*SR), int(t1*SR); f = int(fade*SR)
    gain[a:b] = np.minimum(gain[a:b], depth)
    gain[max(0,a-f):a] = np.minimum(gain[max(0,a-f):a], np.linspace(1, depth, a-max(0,a-f)))
    gain[b:b+f] = np.minimum(gain[b:b+f], np.linspace(depth, 1, len(gain[b:b+f])))
L = {(l["scene"], l["i"]): l for l in TL["lines"]}
for k in SND.get("hush_before", []):            # 关键句前的安静，例 "smoke:3"
    sid, i = k.split(":"); l = L[(sid, int(i))]; dip(l["t0"]-0.75, l["t0"]+0.05, 0.08)
for sid in SND.get("breath_scene", []):          # 段落开头的喘息，例 "bp"
    dip(sc[sid]["t0"]+0.2, L[(sid,0)]["t0"]+0.05, 0.10)
# sidechain duck from voice envelope
e = np.abs(vo); win = int(0.08*SR); e = np.convolve(e, np.ones(win)/win, 'same')
duck = 1 - float(SND.get("duck", 0.55))*np.clip(e/0.05, 0, 1)
duck = np.convolve(duck, np.ones(int(0.15*SR))/int(0.15*SR), 'same')
# 跟着旁白的轻重缓急走（script.json sound.dynamics）：
#   intensity 每段的整体力度；句与句之间的空档里音乐抬起来接话；重音时刻（boom/stamp/chime）短暂推一下
dyn = np.ones(N); D = SND.get("dynamics")
if D:
    for sid, v in D.get("intensity", {}).items():
        if sid in sc: a, b = int(sc[sid]["t0"]*SR), int(sc[sid]["t1"]*SR); dyn[a:b] = v
    lines = sorted(TL["lines"], key=lambda l: l["t0"])
    for l0, l1 in zip(lines, lines[1:]):
        if l1["t0"] - l0["t1"] > 0.35: a, b = int((l0["t1"]+0.05)*SR), int((l1["t0"]-0.1)*SR); dyn[a:b] *= D.get("gap_lift", 1.35)
    k = int(0.4*SR); dyn = np.convolve(np.pad(dyn, k, mode="edge"), np.ones(2*k)/(2*k), "same")[k:-k][:N]
    for ev in json.load(open(f"{EP}/out/events.json")):
        if ev["type"] in ("boom", "stamp", "chime"):
            a = int(ev["t"]*SR); n = int(0.9*SR); seg = dyn[a:a+n]
            seg *= 1 + (D.get("hit_lift", 1.25)-1)*np.sin(np.pi*np.linspace(0, 1, len(seg)))**2
    print("配乐动态：按段落力度 / 句间接话 / 重音推送")
music *= (gain*duck*dyn)[:, None]

# ---------------- foley from page events ----------------
fx = np.zeros((N, 2))
def whoosh():
    n = int(0.7*SR); x = rng.standard_normal(n); tt = np.arange(n)/n
    out = np.zeros(n)
    for j in range(0, n, 2400):
        c = 300 + 3200*np.sin(np.pi*tt[j])**2
        seg = x[j:j+2400]; out[j:j+len(seg)] = bp(seg, c*0.7, min(c*1.4, 20000))
    return out*np.sin(np.pi*tt)**2*0.6
def tick():
    n = int(0.05*SR); tt = np.arange(n)/SR
    return (np.sin(2*np.pi*2400*tt) + 0.5*rng.standard_normal(n)*np.exp(-tt*300))*np.exp(-tt*90)*0.5
def stamp():
    n = int(0.4*SR); tt = np.arange(n)/SR
    body = np.sin(2*np.pi*(90*np.exp(-tt*12)+50)*tt)*np.exp(-tt*14)
    crack = hp(rng.standard_normal(n), 1500)*np.exp(-tt*60)*0.5
    return (body + crack)*0.8
def pop():
    n = int(0.18*SR); tt = np.arange(n)/SR
    return np.sin(2*np.pi*(880+500*np.exp(-tt*40))*tt)*np.exp(-tt*28)*0.45
def boom():          # 冲击：低频下潜 + 一点点空气感，峰值在开头
    n = int(1.1*SR); tt = np.arange(n)/SR
    sub = np.sin(2*np.pi*(55*np.exp(-tt*3)+38)*tt)*np.exp(-tt*4.5)
    air = lp(rng.standard_normal(n), 900)*np.exp(-tt*9)*0.35
    return (sub + air)*np.minimum(1, tt*400)*0.9
def riser():         # 0.6 秒上扬的噪声，峰值在末尾（对齐到冲击点）
    n = int(0.6*SR); tt = np.arange(n)/n; x = rng.standard_normal(n); out = np.zeros(n)
    for j in range(0, n, 2400):
        c = 400 + 5000*tt[j]**2; seg = x[j:j+2400]; out[j:j+len(seg)] = bp(seg, c*0.6, min(c*1.5, 20000))
    return out*tt**2.2*0.5
def chime():         # 改善：两个温和的钟音
    n = int(1.4*SR); tt = np.arange(n)/SR
    x = sum(a*np.sin(2*np.pi*f*tt)*np.exp(-tt*d) for f, a, d in ((1174.7, .5, 3.5), (1760, .3, 4.5), (2349.3, .15, 6)))
    return x*np.minimum(1, tt*300)*0.5
def ember():         # 轻微的噼啪声
    n = int(0.5*SR); tt = np.arange(n)/SR; x = np.zeros(n)
    for k in rng.integers(0, n-400, 9): x[k:k+300] += hp(rng.standard_normal(300), 2500)*np.exp(-np.arange(300)/40)
    return x*0.4
SFX = {"whoosh": (whoosh, 0.5), "tick": (tick, 0.35), "stamp": (stamp, 0.7), "pop": (pop, 0.5), "pulse": (lambda: HB, 0.9),
       "boom": (boom, 0.75), "riser": (riser, 0.35), "chime": (chime, 0.45), "ember": (ember, 0.4)}
# 钟表滴答：script.json 的 sound.clock 列出的段落，每秒一声，很轻
for sid in SND.get("clock", []):
    if sid in sc:
        for tt0 in np.arange(sc[sid]["t0"]+0.5, sc[sid]["t1"]-0.3, 1.0): add(fx, tick(), tt0, 0.12)
for ev in EV:
    f, g = SFX[ev["type"]]; x = f()
    peak = int(np.argmax(np.abs(x)))                # align by measured peak
    add(fx, x, max(0, ev["t"] - peak/SR), g, pan=0.0)

# ---------------- voice chain: gentle compression ----------------
def comp(x, thr=0.12, ratio=3.0):
    e = np.convolve(np.abs(x), np.ones(480)/480, 'same') + 1e-9
    gr = np.where(e > thr, (thr*(e/thr)**(1/ratio))/e, 1.0)
    gr = np.convolve(gr, np.ones(960)/960, 'same')
    return x*gr
v = comp(hp(vo, 70)); v = v/ (np.sqrt(np.mean(v[np.abs(v)>0.01]**2))+1e-9) * 0.12   # voice RMS ~ -18 dBFS
vst = np.stack([v, v], 1)
m_rms = np.sqrt(np.mean(music**2)) + 1e-9
music = music/m_rms*0.12*10**(-15/20)                                               # music ~13-15 dB under voice
mix = vst + music + fx*0.6
mix /= max(1.0, np.max(np.abs(mix))/0.95)
sf.write(f"{EP}/out/mix.wav", mix[:int(DUR*SR)].astype(np.float32), SR)
print("mix ok", DUR)
