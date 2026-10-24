---
name: "local-zh-voice-music"
description: "在用户 Mac 上用本地模型给视频做中文配音（Qwen3-TTS）、读音回检（Qwen3-ASR/对齐）和 AI 配乐（ACE-Step）；接入《高性价比人生指南》视频工程出片。"
---

# 本地中文配音 + AI 配乐

用户的 Mac（M5 Max，128GB）上已经装好整套本地音频模型，不花积分、不联网。本技能说明它们在哪、怎么用、怎么接进视频工程，以及哪些事 Claude 能做、哪些必须让用户在终端里运行。

## 0. 先搞清楚执行环境（最重要）

- Claude 通过 `mcp__remote-devices__device_bash` 拿到的 shell 是用户电脑上的一台 **Linux 虚拟机**（约 4 核、3GB 内存，没有 Metal/MLX）。它能读写已授权的文件夹，但**跑不了 MLX 模型**，也不要往里面的 macOS 虚拟环境装包。
- computer use 里「终端」只有点击权限，不能打字。
- 所以分工固定为：**Claude 写脚本、改工程、读日志、分析产物；模型推理由用户在 Mac 终端运行一条命令完成。** 给用户的命令要一行能复制、路径是 Mac 上真实存在的。
- 需要访问文件夹时，用 `device_request_folder_access` 申请具体路径（用户提过或任务需要的）；删除文件要先 `device_request_delete_permission`，只删用户点名的东西。
- 虚拟机里可以 `pip install --user numpy scipy soundfile soxr` 用来做音频数值分析和跑混音测试。

## 1. 已安装的环境

根目录：`~/Documents/ChatGPT/kindle/audio-stack/`（环境变量 `AUDIO_STACK` 可覆盖）

| 用途 | 模型 / 位置 |
|---|---|
| 音色设计 | `models/Qwen3-TTS-1.7B-VoiceDesign-bf16` |
| 音色复用（克隆参考音频） | `models/Qwen3-TTS-1.7B-Base-bf16` |
| 语音识别回检 | `models/Qwen3-ASR-1.7B-8bit` |
| 逐字时间戳 | `models/Qwen3-ForcedAligner-0.6B-8bit` |
| 配乐 | `ACE-Step-1.5/`，DiT 默认 `acestep-v15-xl-sft`（4B），另有 `acestep-v15-turbo`；LM `acestep-5Hz-lm-1.7B`；后端 MLX |

- 语音环境：`audio-stack/.venv`（Python 3.12，mlx-audio）。配乐环境：`audio-stack/ACE-Step-1.5/.venv`（Python 3.11）。两者隔离，不要混装。
- 现成入口：`./speech.command design|base|asr|align …`、双击 `start-music.command` 打开 http://127.0.0.1:7860 中文界面。
- `model-manifest.json` 记录每个文件的大小和权重 SHA-256；`verification/` 有安装时的实测音频和结果；`verify_speech.py`、`verify_music.py` 是已验证可用的 Python 调用范例，写新脚本时照抄它们的调用方式。

### 已验证的 Python 调用要点
- TTS：`load_model(path)`；VoiceDesign 用 `model.generate_voice_design(text=, instruct=, language='Chinese', max_tokens=)`；Base 用 `model.generate(text=, language='Chinese', ref_audio=, ref_text=, max_tokens=)`。结果是生成器，`r.audio.astype(mx.float32)` 转 numpy，采样率 `r.sample_rate`（24000）。没有 seed 参数，用 `mx.random.seed(n)` 控制。
- ASR：`from mlx_audio.stt import load`；`load(path).generate(wav, language='Chinese').text`。
- 对齐：同一个 `load`，`aligner.generate(audio=, text=, language='Chinese')` 返回带 `text/start_time/end_time` 的列表。
- 换模型前 `del model; gc.collect(); mx.clear_cache()`。
- ACE-Step：`AceStepHandler().initialize_service(project_root=REPO, config_path=模型名, device='mps', use_flash_attention=False, compile_model=False, offload_to_cpu=False, use_mlx_dit=True)`；`LLMHandler().initialize(checkpoint_dir=REPO/'checkpoints', lm_model_path='acestep-5Hz-lm-1.7B', backend='mlx', device='mps')`；`generate_music(dit, llm, GenerationParams(caption=, lyrics='[Instrumental]', instrumental=True, bpm=, keyscale='D minor', duration=秒, inference_steps=, seed=, thinking=False), GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format='wav'), save_dir=)`。XL-SFT 用 32–64 步，Turbo 用 8 步。

## 2. 接入《高性价比人生指南》视频工程

工程在 `~/高性价比人生指南-视频工程/`（34 集，画面由代码逐帧渲染）。已接好：

- `engine/voice_local.py`：逐句配音。全系列一个旁白音色（`voices/narrator.wav` + `narrator.json`），用 Base 模型复用，保证 34 集声音一致。每句生成后 Qwen3-ASR 回听，相似度 < 0.92 或语速不在 2.8–7.5 字/秒就换种子重试，最多 4 次；输出 `vo/lines/{场景}_{句}.wav` 和 `vo/voice_report.txt`（⚠️ 的句子要人工听）。按文本哈希缓存，只重做改过的句子。口播稿含【待写】会拒绝生成。
- `engine/music_local.py`：按 `timeline.json` 的时长 +3 秒生成纯音乐铺底 `out/bgm.wav`；参数没变不重生成。
- `engine/mix.py`：有 `out/bgm.wav` 就用它替代代码合成的和弦与低音铺底，保留心跳、玻璃音、音效、人声压缩和闪避；铺底音量相对心跳层由 `sound.bgm_gain`（默认 2.2）控制，最终音乐比人声低约 15 dB。
- `build.sh`：

```sh
./build.sh voice-design [6]          # 生成候选旁白音色 → voices/candidates/cand_*.wav
./build.sh voice-pick <编号>         # 定下全系列旁白音色（只做一次）
./build.sh epNN voice [--redo hook:0,belt:2]
./build.sh epNN music [--cands 3 | --use 2]
./build.sh epNN                      # 全流程：配音 → 时间线 → 配乐 → 混音 → 渲染 → 合成 → 封面 → 交付
```

有 `vo/take.*`（外部整段配音，如第 1、2 集）的集仍走原来的 `align` 切分。`script.json` 可选字段：`"music": {"caption", "bpm", "key", "seed", "steps", "model", "off"}`。原版 `build.sh`、`engine/mix.py` 备份为 `.bak`。

## 3. 旁白音色与配乐风格

- 旁白描述（VoiceDesign instruct）：中年男性，四十岁左右，标准普通话，嗓音低沉浑厚、有磁性，语速舒缓，吐字清晰，语气沉稳温暖、娓娓道来，像纪录片旁白，不夸张不播音腔。参考句约 9 秒，覆盖平叙和停顿。
- **只克隆用户自己的声音或模型设计出的音色**，不克隆任何真人（比如知名纪录片解说员）的声音。
- 配乐默认 caption：极简纪录片铺底，温暖克制，模拟合成器长音、毛毡钢琴动机、低音大提琴持续音、轻马林巴，无鼓、无人声、无高潮，给旁白留空间；64 BPM，D 小调。避免泛泛的「钢琴 + 弦乐」。

## 4. 口播稿读法（voice_local.py 的 to_spoken 已实现）

- 百分数 → 百分之…；小数 → …点…；`0:10` → 零点十分；四位数加「年」→ 逐位读（二零二五年）；`打/拨/电话/热线/号码/编号` 后的数字逐位读；整数按万、亿读（一万零一十、十四亿）；首位 2000/2万/2亿 读「两」；量词前的 2 读「两」；mg/kg/km/ml/mmHg 等转中文单位；括号改成逗号停顿；去掉引号书名号。
- 转换结果写进报告的「读作」列；仍含字母或 `/` 等符号的句子标 ⚠️，提示用户改稿（例如「140/90」改成「高压一百四十、低压九十」）。
- 写口播稿时尽量直接用汉字数字，字幕（subs）用阿拉伯数字。

## 5. 安装和排错经验

- 国内下载 HuggingFace 大文件：能连上主页不代表大文件能下。新传输协议（xet）在国内容易无声断流，进度长时间不动且不报错。办法：`HF_ENDPOINT=https://hf-mirror.com`、`HF_HUB_DISABLE_XET=1`、`HF_HUB_DOWNLOAD_TIMEOUT=60`，循环重试 `hf download` 续传；或从 ModelScope 下，只在两边 SHA-256 一致时使用。`huggingface_hub` 新版已没有 `[cli]` extra，直接装 `huggingface_hub` 就带 `hf` 命令。
- 判断下载是否卡住：看 `.cache/huggingface/download/*.incomplete` 的大小和修改时间隔 20 秒是否变化。
- 核对模型完整性：对照 `model-manifest.json` 逐个比文件大小。ACE-Step 加载时会用仓库代码覆盖 checkpoint 里同名的 `.py`（如 `apg_guidance.py`），大小不一致属正常，看权重即可。
- 用户说「已经装好/下好」却找不到时，申请 `~` 只读后用 `find . -xdev` 按目录名搜（qwen3-tts、qwen3_asr、forcedaligner、acestep），跳过 `Library/Caches`、`.Trash`、`.npm`、`.cache/uv`。

## 6. 验收方法（Claude 能做的部分）

- 音频数值检查：时长、采样率、峰值 dBFS、RMS、静音占比、削波点数；人声峰值约 −6 dBFS、无削波为正常。
- 混音改动先在虚拟机里拷一份集数据（`script.json`、`timeline.json`、`out/vo.wav`、假 `events.json`、模拟 `bgm.wav`）跑新旧两版 `mix.py` 对比，再交给用户。
- 文本处理函数用桩模块（stub 掉 mlx、mlx_audio）在虚拟机里单测。
- Claude 听不到声音：最终音质、音色是否喜欢，必须请用户试听确认，不要声称「听起来不错」。

## 7. 版权与署名

Qwen3-TTS（Apache 2.0）、ACE-Step 1.5（MIT，可商用）。片尾和简介的署名写实际使用的配音、配乐来源；原书内容按 CC BY 4.0 署名。