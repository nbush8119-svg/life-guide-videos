"""封面：渲染片头大字帧（无字幕），下半部叠加本集标语 → out/cover.jpg（竖版 1080×1920）。
用法：python3 engine/cover.py episodes/ep01"""
import sys, json, subprocess, os
from PIL import Image, ImageDraw, ImageFont
EP = sys.argv[1]; HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(f"{EP}/script.json")); tl = json.load(open(f"{EP}/timeline.json")); cv = d["cover"]
sid, i, _ = cv["t"].split(":"); l = [x for x in tl["lines"] if x["scene"] == sid and x["i"] == int(i)][0]
t = l["t1"] + 0.3
subprocess.run([sys.executable, f"{HERE}/render.py", EP, "cover", str(t)], check=True)
im = Image.open(f"{EP}/out/cover_raw.jpg").convert("RGB"); g = ImageDraw.Draw(im)
S = ImageFont.truetype(f"{HERE}/fonts/NotoSerifCJKsc-Black.otf", 96); B = ImageFont.truetype(f"{HERE}/fonts/NotoSansCJKsc-Bold.otf", 52)
Y = cv.get("y", 1160)   # 文字块顶端；画面内容偏下时调低
if cv.get("shade"): im.paste(Image.new("RGB", (1080, 1920-Y+120), (14, 14, 16)), (0, Y-120), Image.linear_gradient("L").resize((1080, 1920-Y+120)).point(lambda v: min(255, v*2)))
g = ImageDraw.Draw(im)
g.rectangle([80, Y-50, 1000, Y-44], fill=(58, 57, 54))
for k, s in enumerate(cv["lines"]): g.text((80, Y + k*130), s, font=S, fill=(242, 237, 228))
g.text((80, Y + len(cv["lines"])*130 + 40), cv["tag"], font=B, fill=(242, 181, 68))
im.save(f"{EP}/out/cover.jpg", quality=93); print("封面：", f"{EP}/out/cover.jpg")
