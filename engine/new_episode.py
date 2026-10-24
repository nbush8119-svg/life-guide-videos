"""从原书章节生成一集的骨架。
用法：python3 engine/new_episode.py 2 [条目数=6]
生成 episodes/ep02/：script.json（口播草稿）、scenes.js（通用模板）、候选条目.md（本章全部条目，按收益排序）、vo/口播稿.txt"""
import sys, re, json, os, glob, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N = int(sys.argv[1]); K = int(sys.argv[2]) if len(sys.argv) > 2 else 6
CN = "零一二三四五六七八九十"
def cn(n): return CN[n] if n <= 10 else ("十" + CN[n-10] if n < 20 else CN[n//10] + "十" + (CN[n%10] if n%10 else ""))
files = sorted(glob.glob(f"{ROOT}/book/[0-9][0-9]-*.md"))
path = files[N-1]; md = open(path, encoding="utf-8").read()
title = re.sub(r"^\d+\.\s*", "", re.search(r"^# (.+)$", md, re.M).group(1)).split("：")[0].strip()
nxt = re.sub(r"^\d+\.\s*", "", re.search(r"^# (.+)$", open(files[N], encoding="utf-8").read(), re.M).group(1)).split("：")[0].strip() if N < len(files) else "（全书完）"
items = []
for m in re.finditer(r"^### (\d+)\. (.+?)\n(.*?)(?=^### |\Z)", md, re.M | re.S):
    num, head, body = m.groups()
    g = lambda k: (re.search(rf"^- {k}：(.+)$", body, re.M) or [None, ""])[1].strip()
    gain = (re.search(r"收益=(\S+)", body) or [None, ""])[1]
    items.append(dict(num=int(num), head=head.strip(), plain=g("说人话"), cost=g("成本"), grade=g("证据等级"), gain=gain))
rank = {"大": 0, "中": 1, "小": 2}
ranked = sorted(items, key=lambda x: (rank.get(x["gain"], 3), x["num"]))
pick = sorted(ranked[:K], key=lambda x: x["num"])
ep = f"{ROOT}/episodes/ep{N:02d}"; os.makedirs(f"{ep}/vo", exist_ok=True)
sent = lambda s: [x for x in re.split(r"(?<=[。！？])", s) if x.strip()]
scenes = [{"id": "hook", "lines": [f"【待写】前三秒钩子：用本集最反常识的一个数字开场。", f"这一集，讲{cn(len(pick))}件事。"],
           "subs": ["【待写】钩子", f"这一集，讲{len(pick)}件事"]}]
ITEMS = {}
for k, it in enumerate(pick, 1):
    sid = f"i{k}"; zh = "最后一件" if k == len(pick) else f"第{cn(k)}件"
    short = re.split(r"[，；,;]", it["head"])[0][:12]
    ITEMS[sid] = {"n": f"{k:02d}", "zh": zh, "title": [short], "sub": it["head"][len(short):].lstrip("，；,; ")[:24] or "原书第 %d 条" % it["num"],
                  "cost": ("成本 · " + re.split(r"[。；]", it["cost"])[0][:16]) if it["cost"] else "", "icon": "generic", "book": it["num"]}
    body = sent(it["plain"])[:2]
    lines = [f"{zh}，{it['head']}。"] + body
    scenes.append({"id": sid, "lines": lines, "subs": [l.rstrip("。") for l in lines]})
scenes.append({"id": "outro", "lines": ["【待写】一句话回顾全部条目。", "【待写】一句总结。", f"下一集，{nxt}。"],
               "subs": ["【待写】回顾", "【待写】总结", f"下一集：{nxt}"]})
script = {"ep": N, "title": title, "next": nxt, "chapter": os.path.basename(path),
          "voice": {"engine": "ElevenLabs via vidIQ", "voice": "Brian - Deep, Resonant and Comforting", "voiceId": "nPczCjzI2devNBz1zQrb"},
          "publish": {"title": f"【待写】标题｜EP{N:02d}", "desc": f"【待写】一句话简介。内容改编自开源书《高性价比人生指南》（CC BY 4.0）github.com/eternity4719/HowToLiveBetter ",
                      "tags": ["高性价比人生指南"], "collection": "高性价比人生指南", "visibility": "公开"},
          "cover": {"t": "hook:0:end+0.3", "lines": ["【待写】", "封面标语"], "tag": f"第 {N} 集 · {title}"},
          "sound": {"heartbeat": ["hook"], "hush_before": [], "breath_scene": []}, "breaths": {},
          "items": ITEMS, "scenes": scenes}
if os.path.exists(f"{ep}/script.json") and "--force" not in sys.argv:
    print("已存在，未覆盖：", f"{ep}/script.json（加 --force 覆盖）")
else:
    json.dump(script, open(f"{ep}/script.json", "w"), ensure_ascii=False, indent=1)
    shutil.copy(f"{ROOT}/engine/template_scenes.js", f"{ep}/scenes.js")
open(f"{ep}/候选条目.md", "w").write(f"# 第 {N} 集《{title}》候选条目（原书 {os.path.basename(path)}，共 {len(items)} 条，按收益排序）\n\n" +
    "\n".join(f"- [{'✓' if it in pick else ' '}] 第{it['num']}条｜收益{it['gain'] or '?'}｜证据{it['grade'] or '?'}｜{it['head']}\n  - 说人话：{it['plain']}\n  - 成本：{it['cost']}" for it in ranked))
open(f"{ep}/vo/口播稿.txt", "w").write("\n".join(l for s in script["scenes"] for l in s["lines"]))
print(f"ep{N:02d}《{title}》：选了 {len(pick)} 条（共 {len(items)} 条）→ {ep}")
