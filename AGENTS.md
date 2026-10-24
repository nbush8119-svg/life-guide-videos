# AGENTS.md · 高性价比人生指南 · 抖音视频工程

给接手本仓库的 agent（Codex、Claude Code 等）。先读本页，再读 [README.md](README.md)（工程目录、命令、设计规范、进度表都在那里）。

## 这是什么

把开源书《高性价比人生指南》（作者 eternity4719，34 章，CC BY 4.0，https://github.com/eternity4719/HowToLiveBetter）改编成 34 集抖音竖屏科普短视频。画面由代码逐帧绘制，一条命令出片：`./build.sh epNN`。

- 第 1 集《不要早死》已发布，是质量标杆：`episodes/ep01/`。
- 第 2 集《不要慢慢死》已有整段配音、时间线、封面和发布文案，场景动画在打磨中。
- 第 3–34 集是自动生成的骨架（`script.json` + 通用 `scenes.js` + `候选条目.md`）。
- 抖音合集名：「高性价比人生指南」。
- 同一位用户还有一个姊妹项目「费曼学习法卡片」（另一个仓库），两个系列共用旁白音色和本地音频模型。

## 用户的长期规则（必须遵守）

1. **用简体中文**沟通，回复简短、先说结论。
2. **不要让用户处理文件**，也**不要让用户跑脚本**。命令由 agent 自己在用户的 Mac 上执行。
3. 在 Mac 上做出的成片和封面，**要上传到对话里让用户直接播放**，不能只给 Mac 路径。
4. **配音、配乐用 Mac 上的本地模型**（Qwen3-TTS / Qwen3-ASR / ACE-Step 1.5），不花 ElevenLabs 额度。全系列一个旁白音色。
5. **每个数字都要能在原书找到出处**，写进该集的 `FACTS.md`。不构成医疗、法律或理财建议。
6. 片尾和简介都写：出处（书名、作者、仓库链接）、CC BY 4.0 许可链接、「节选缩写」、同步版本日期；配音和配乐的实际来源。
7. **发布到抖音、修改已发布作品之前，必须得到用户本人确认**。上传版 ≤ 10MB（`deliver.py` 压到 ≤ 9.8MB），标题 ≤ 30 字，公开，进合集。
8. **绝不提交**密钥、Cookie、浏览器登录态。

## 仓库里有什么、没有什么

已入库：引擎代码 `engine/`、原书 `book/`、34 集的 `script.json` / `scenes.js` / `候选条目.md` / `FACTS.md` / `timeline.json`、第 1 集发布版成片（9.9MB）和封面、Inter 字体、两个相关技能的原文 `docs/skills/`。

没入库（`.gitignore`）：

| 内容 | 怎么拿回来 |
|---|---|
| Noto CJK 字体（约 75MB） | `scripts/fetch_fonts.sh` |
| 旁白参考 `voices/narrator.wav` | 来自 ElevenLabs Brian，只在用户 Mac 上。`voices/narrator.json` 记录了来源和参考文本 |
| 第 1、2 集整段配音 `vo/take.mp3`、逐句 `vo/lines/`、`out/vo.wav` | 同上，只在用户 Mac 上；新集用本地 TTS 生成 |
| 第 1 集完整版成片（20MB） | `./build.sh ep01 mux` 重新合成，或在 Mac 上取 |
| `.venv/`、`models/`（离线 ASR 模型） | `sh setup.sh` |

## 运行环境

- 用户的 Mac：`~/高性价比人生指南-视频工程/`（本仓库的原始位置）。
- 本地音频模型：`~/Documents/ChatGPT/kindle/audio-stack/`（环境变量 `AUDIO_STACK` 可覆盖），只能在 Apple Silicon 上用 MLX 跑。用法和排错见 `docs/skills/local-zh-voice-music.md`。
- 渲染：Python（playwright、numpy、scipy、soundfile、soxr、sherpa-onnx、pillow、fonttools）+ Chromium + ffmpeg，`sh setup.sh` 一次装好。

## 做一集的最短路径

1. `python3 engine/new_episode.py N` 生成骨架（34 集都已生成过）。
2. 在 `script.json` 里补完所有 `【待写】`；数字核对写进 `FACTS.md`。口播里数字写汉字，字幕 `subs` 里写阿拉伯数字。
3. `./build.sh epNN voice` 本地配音 + 回检，看 `vo/voice_report.txt` 里的 ⚠️。
4. `./build.sh epNN music --cands 3`，把候选发给用户试听，`--use <编号>` 定下。
5. `./build.sh epNN` 全流程出片；`./build.sh epNN stills 5 20 40 …` 出联系表自查。
6. 想达到第 1 集水准，在 `scenes.js` 给每条写专属数据动画（参考 `episodes/ep01/scenes.js`）。
7. 成片、封面发给用户看；用户确认后发布，然后更新 README 的进度表。
