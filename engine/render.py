"""逐帧渲染。
  python3 engine/render.py episodes/ep01 events          导出音效事件
  python3 engine/render.py episodes/ep01 stills 3 20 55  渲染检查帧（out/still_*.jpg + out/sheet.jpg）
  python3 engine/render.py episodes/ep01 video [fps]     渲染整片画面（out/video.mp4）
  python3 engine/render.py episodes/ep01 cover <t>       渲染无字幕封面帧（out/cover_raw.jpg）"""
import sys, json, subprocess, asyncio, base64, os, pathlib
from playwright.async_api import async_playwright
EP = pathlib.Path(sys.argv[1]).resolve(); MODE = sys.argv[2]; ARGS = sys.argv[3:]
ENGINE = pathlib.Path(__file__).resolve().parent
TL = json.load(open(EP/"timeline.json"))
async def main():
    async with async_playwright() as p:
        exe = os.environ.get("CHROMIUM")  # 可选：指定浏览器路径
        b = await p.chromium.launch(executable_path=exe) if exe else await p.chromium.launch()
        pg = await b.new_page(viewport={"width":1080,"height":1920}, device_scale_factor=1)
        init = "window.__TL__=" + json.dumps(TL, ensure_ascii=False) + (";window.NOSUB=true;" if MODE=="cover" else "")
        th = os.environ.get("THEME") or json.load(open(EP/"script.json")).get("theme")
        if th: init += ";" + (ENGINE/"themes.js").read_text() + f";window.__THEME__=window.__THEMES__[{json.dumps(th)}];"
        await pg.add_init_script(init)
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        rel = os.path.relpath(EP, ENGINE)
        await pg.goto((ENGINE/"index.html").as_uri() + "?ep=" + rel)
        await pg.wait_for_function("window.READY===true", timeout=30000)
        if errs: print("页面报错:", errs); sys.exit(1)
        el = await pg.query_selector("canvas"); out = EP/"out"; out.mkdir(exist_ok=True)
        if MODE == "events":
            json.dump(await pg.evaluate("window.EV"), open(out/"events.json","w")); print("音效事件已导出")
        elif MODE in ("stills", "cover"):
            names = []
            for a in ARGS:
                await pg.evaluate(f"render({a})")
                n = out/("cover_raw.jpg" if MODE=="cover" else f"still_{os.environ.get('STILL_TAG','')}{float(a):06.2f}.jpg")
                await el.screenshot(path=str(n), type="jpeg", quality=92); names.append(str(n))
            if MODE == "stills" and len(names) > 1:
                cols = min(len(names), 8)
                subprocess.run(["ffmpeg","-y","-v","error",*sum([["-i",n] for n in names],[]),"-filter_complex",
                    f"{''.join(f'[{i}]scale=270:480[s{i}];' for i in range(len(names)))}{''.join(f'[s{i}]' for i in range(len(names)))}xstack=inputs={len(names)}:layout="
                    + "|".join(f"{(i%cols)*270}_{(i//cols)*480}" for i in range(len(names))) + ":fill=gray", str(out/"sheet.jpg")], check=True)
                print("检查帧：", out/"sheet.jpg")
        elif MODE == "video":
            fps = int(ARGS[0]) if ARGS else 30
            ff = subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","image2pipe","-framerate",str(fps),"-c:v","mjpeg","-i","-",
                 "-c:v","libx264","-preset","medium","-crf","17","-pix_fmt","yuv420p",str(out/("video_part.mp4" if os.environ.get("RANGE") else "video.mp4"))], stdin=subprocess.PIPE)
            n = int(TL["dur"]*fps); rng = os.environ.get("RANGE")   # 例 RANGE=0:17.5 只渲染这一段 → out/video_part.mp4
            i0, i1 = (int(float(x)*fps) for x in rng.split(":")) if rng else (0, n)
            for i in range(i0, min(i1, n)):
                data = await pg.evaluate("(t)=>{render(t);return document.getElementById('c').toDataURL('image/jpeg',0.93)}", i/fps)
                ff.stdin.write(base64.b64decode(data.split(",",1)[1]))
                if i % 300 == 0: print(f"{i}/{n}", flush=True)
            ff.stdin.close(); ff.wait(); print("画面完成：", out/"video.mp4")
        if errs: print("页面报错:", errs)
        await b.close()
asyncio.run(main())
