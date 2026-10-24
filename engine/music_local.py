"""本地 AI 配乐（ACE-Step 1.5 XL-SFT，MLX）：按本集时长生成纯音乐铺底 → out/bgm.wav，mix.py 会自动用它替代代码合成的铺底。
用 audio-stack 里 ACE-Step 的 Python 运行（build.sh 会自动处理）：
  music_local.py episodes/ep03              按 script.json 的 music 设置生成（没设置就用系列默认）
  music_local.py episodes/ep03 --cands 3    一次生成 3 个版本 → out/bgm_cand_*.wav，试听后用 --use 选
  music_local.py episodes/ep03 --use 2      把候选 2 设为本集配乐
参数没变不会重复生成。script.json 里可选：
  "music": {"caption": "...", "bpm": 64, "key": "D minor", "seed": 7, "steps": 48, "model": "acestep-v15-xl-sft", "off": false}"""
import sys, os, json, time, math, hashlib, shutil
from pathlib import Path
STACK = Path(os.environ.get("AUDIO_STACK", Path.home()/"Documents/ChatGPT/kindle/audio-stack"))
REPO = STACK/"ACE-Step-1.5"
sys.path.insert(0, str(REPO))
os.environ["TOKENIZERS_PARALLELISM"] = "false"; os.environ["ACESTEP_LM_BACKEND"] = "mlx"

DEFAULT = {   # 系列统一的配乐气质：纪录片、温暖克制、给人声留空间
    "caption": ("Minimal documentary underscore, calm and hopeful, warm analog synth pad, soft felt piano motifs, "
                "low cello drone, gentle marimba, slow evolving texture, sparse, lots of space for narration, "
                "no drums, no vocals, no melody climax, mellow and intimate"),
    "bpm": 64, "key": "D minor", "seed": 7, "steps": 48, "model": "acestep-v15-xl-sft",
}

def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    ep = Path(a[0]); out = ep/"out"; out.mkdir(exist_ok=True)
    if "--use" in a:
        k = a[a.index("--use")+1]; shutil.copy(out/f"bgm_cand_{k}.wav", out/"bgm.wav")
        json.dump({"picked": int(k)}, open(out/"bgm.json", "w")); print(f"本集配乐 = 候选 {k}"); return
    d = json.load(open(ep/"script.json")); cfg = {**DEFAULT, **d.get("music", {})}
    if cfg.get("off"): print("本集 music.off = true，跳过 AI 配乐（使用代码合成铺底）"); return
    tl = json.load(open(ep/"timeline.json")); dur = int(math.ceil(tl["dur"])) + 3
    cands = int(a[a.index("--cands")+1]) if "--cands" in a else 1
    key = hashlib.md5(json.dumps([cfg, dur, cands], sort_keys=True).encode()).hexdigest()[:10]
    meta = out/"bgm.json"
    if cands == 1 and (out/"bgm.wav").exists() and meta.exists() and json.load(open(meta)).get("hash") == key:
        print("配乐参数和时长都没变，沿用 out/bgm.wav"); return

    from acestep.handler import AceStepHandler
    from acestep.llm_inference import LLMHandler
    from acestep.inference import GenerationParams, GenerationConfig, generate_music
    t0 = time.time()
    dit = AceStepHandler()
    st, ok = dit.initialize_service(project_root=str(REPO), config_path=cfg["model"], device="mps",
                                    use_flash_attention=False, compile_model=False, offload_to_cpu=False, use_mlx_dit=True)
    assert ok, st
    llm = LLMHandler()
    st, ok = llm.initialize(checkpoint_dir=str(REPO/"checkpoints"), lm_model_path="acestep-5Hz-lm-1.7B", backend="mlx", device="mps")
    assert ok, st
    seeds = [int(cfg["seed"]) + i for i in range(cands)]
    params = GenerationParams(caption=cfg["caption"], lyrics="[Instrumental]", instrumental=True, bpm=int(cfg["bpm"]),
                              keyscale=cfg.get("key", ""), duration=dur, inference_steps=int(cfg["steps"]),
                              seed=seeds[0], thinking=False)
    gen = GenerationConfig(batch_size=1, use_random_seed=False, seeds=seeds[:1], audio_format="wav")
    tmp = out/".bgm_tmp"; tmp.mkdir(exist_ok=True)
    files = []
    for i, s in enumerate(seeds):
        params.seed = s; gen.seeds = [s]
        r = generate_music(dit, llm, params, gen, save_dir=str(tmp))
        assert r.success, r.error or r.status_message
        p = r.audios[0].get("path") or r.audios[0].get("audio_path")
        dst = out/(f"bgm_cand_{i+1}.wav" if cands > 1 else "bgm.wav"); shutil.move(p, dst); files.append(dst)
        print(f"生成 {dst.name}（{dur} 秒，种子 {s}）", flush=True)
    shutil.rmtree(tmp, ignore_errors=True)
    if cands == 1: json.dump({"hash": key, "cfg": cfg, "dur": dur, "date": time.strftime("%Y-%m-%d %H:%M")}, open(meta, "w"), ensure_ascii=False, indent=1)
    else: print(f"试听 {out}/bgm_cand_*.wav，选好后运行：./build.sh {ep.name} music --use <编号>")
    print(f"用时 {time.time()-t0:.0f} 秒")

if __name__ == "__main__": main()
