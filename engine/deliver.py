"""交付：SRT 字幕 + 抖音网页上传用的 ≤9.8MB 发布版 + 发布文案。
用法：python3 engine/deliver.py episodes/ep01"""
import sys, json, subprocess, os
EP = sys.argv[1]; d = json.load(open(f"{EP}/script.json")); tl = json.load(open(f"{EP}/timeline.json"))
name = f"EP{d['ep']:02d}_{d['title']}"; out = f"{EP}/out"
def ts(t): return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round((t-int(t))*1000))%1000:03d}"
open(f"{out}/{name}.srt", "w").write("\n".join(f"{k}\n{ts(l['t0'])} --> {ts(l['t1']+0.4)}\n{l['sub']}\n" for k, l in enumerate(tl["lines"], 1)))
src = f"{out}/{name}.mp4"; pub = f"{out}/{name}_发布版.mp4"
for crf in (24, 25, 26, 27, 28, 30):
    subprocess.run(["ffmpeg","-y","-v","error","-i",src,"-c:v","libx264","-preset","slow","-crf",str(crf),"-tune","animation",
                    "-c:a","aac","-b:a","128k","-movflags","+faststart",pub], check=True)
    if os.path.getsize(pub) <= 9.8*1024*1024: break
p = d["publish"]
open(f"{out}/发布文案.txt","w").write(f"标题：{p['title']}\n\n简介：{p['desc']}{' '.join('#'+x for x in p['tags'])}\n\n合集：{p['collection']}（第 {d['ep']} 集）\n可见：{p['visibility']}\n")
print(f"字幕 {name}.srt；发布版 {os.path.getsize(pub)/1e6:.1f}MB (crf {crf})；发布文案.txt")
