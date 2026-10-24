---
name: "opus-video-studio"
description: "用代码拍高质量视频（动态图形、科普讲解、产品发布、MV、抖音竖屏）：做视频、动画短片、宣传片、配音字幕视频时使用。"
---

# Opus 视频工作室：用代码拍视频

整理自 lemo-opuscar（59 种风格 + 导演/技术指南）、awesome-opus5-5-videos（703 条提示词）、opus-video-prompts（中文精选）、onetake（产品动效方法）、HyperFrames、Remotion skills，以及人人都是产品经理《用 Claude Opus 5.5 做视频堪称一绝》一文。

本地资料库：用户 Mac 上的 `~/opus-video-kit/`（01-方法论、02-提示词模板、03-风格库、04-抖音竖屏与中文配音、styles/*.md 共 59 份风格规范、提示词全集 703 条）。需要细节时先读这里；在云端时用设备文件工具暂存后读取。

## 0. 原理
不生成视频，而是写代码画每一帧：
时间线（唯一真相）→ 画面 `render(t)` 网页 → 无头 Chrome 逐帧 JPEG 截图 → ffmpeg；配音逐句 TTS → 语音识别回检 → 时间戳；配乐和音效按同一时间线生成；字幕 .srt + 烧录；混音 → 两遍 loudnorm −14 LUFS。

## 1. 需要代码时再拉取的仓库
```sh
mkdir -p ~/refs && cd ~/refs
git clone --depth 1 https://github.com/lemomo-ai/lemo-opuscar        # 风格、core/ 渲染/TTS/采样器/sfx/mux 工具、demo 源码
git clone --depth 1 https://github.com/yihui-dev/awesome-opus5-5-videos
git clone --depth 1 https://github.com/joeseesun/opus-video-prompts
git clone --depth 1 https://github.com/feitangyuan/onetake          # 非商用许可：只学方法，不用于商用片
git clone --depth 1 https://github.com/heygen-com/hyperframes
git clone --depth 1 https://github.com/remotion-dev/skills
```
路线选择：默认手写单 HTML + Canvas/DOM + Playwright 截帧（最灵活）；用户点名时用 HyperFrames 或 Remotion；3D 用 three.js；数学讲解可用 Manim。

## 2. 技术铁律
- 每一帧只由 t 决定：`window.DUR`、`window.render(t)`、`window.READY`、`window.EV=[{t,type}]`（音效事件）、`window.TEXTS(t)`（可见文字）。不用 CSS 动画、计时器、无种子随机数、跨帧状态。
- JPEG 截图；一个 worker 一个浏览器；颗粒在 ffmpeg 里加。运动模糊：每帧 3–4 个子帧 + `tmix`。
- 弹簧用闭式解；改目标就叠加弹簧，保持纯函数。
- 一个世界→屏幕坐标函数。被相机缩放的元素别加 will-change；preserve-3d 元素淡出要淡外层。
- 中文字体：本地 Noto Sans/Serif CJK，或用 Google Fonts `&text=` 子集化后自带；渲染时不链外网。

## 3. 工作流（不跳步）
1. 一次问完自己决定不了的：事实、必须出现的品牌、用户自己的素材/音色/音乐、语言、要不要先看分镜。之后不再追问。
2. 选 1–2 个标杆：写下学什么、不学什么。
3. 三个候选概念（「画面由什么构成」：一个元素贯穿变形、穿越尺度的镜头、前后对比、连锁反应、物理隐喻、排版系统）→ 选一个。
4. 写 TREATMENT.md：logline、起承转合、镜头表（景别/角度/运镜/时长/为什么）、逐秒节拍表、cue map（每个 cut 和动作落在哪一拍）、声音设计表、字幕与标题设计。陈述事实的片子另写 FACTS.md（每条附来源原文）。
5. 用真实代码渲 3 张风格帧（含招牌镜头）先自查；用户要分镜才停下等确认。
6. 生产：配音 → 回检 → 配乐 → 动画 → 混音 → 渲染。
7. 自检（联系表两遍、关键动作 0.2 秒拉帧、ebur128、blackdetect、Whisper 回听、全速带声音看一遍）→ 只修一轮 → 交付 mp4、poster.jpg、srt、TREATMENT.md、CREDITS、build.sh。

## 4. 导演法则
- 前 3 秒钩子；一个只有这种媒介能做的招牌动作放在情绪高点；结尾呼应开头。
- 拒绝 PPT 感：镜头时长差 ≥4 倍；至少一次加速或减速和一次喘息；每个段落边界都要有东西活过切换（手、主体、变形成下一场景的容器、iris、zoomThrough、gather→seal）。硬切只留给连击和落版。
- 阅读时间：字幕 ≥ max(1.8 秒, 口播 + 0.6 秒)；中文文字动画后停留 ≈ 字数/4.5 + 1.5 秒；标题卡 ≥ 4 秒。
- 镜头：≥4 种运镜，一个招牌镜头，转场在媒介内部完成，关键时刻主体 ≥ 画面高度 1/3。
- 声音：每个可见动作有声音、匹配材质；环境/拟音/音乐三层；人声高于音乐约 10 dB；至少两次安静；两次声音转场（J/L cut）；不用泛泛的钢琴加弦乐；低频别过重；音效按峰值对齐；−14 LUFS、≤ −1 dBTP。
- 禁用：粒子爆炸、冲击波、RGB 分离、光晕、霓虹辉光、乱抖、网格地板、闪烁背景、弹跳缓动、模板渐变、默认淡入淡出。
- 常见失败：主体太小或贴边、太暗、同色叠同色、字幕挡主体、梗太快、转场空白帧、跟随效果没跟上。

## 5. 提示词骨架（给自己或用户写提示词时）
`<inputs>` 先要什么 → `<direction>` 一句话概念、字体、色板、镜头语法、禁用清单 → `<structure>` BPM/小节/每段内容 → `<build>` 实现约束 → `<gotchas>` → `<start>` 先交分镜或节拍表。填空模板在 `~/opus-video-kit/02-提示词模板.md`（竖屏科普、产品发布、UI 变形循环、线稿讲解、口播转 B-roll、历史电影、企业讲解、MV、一句话试手）。

## 6. 风格
59 种风格见 `~/opus-video-kit/03-风格库.md`，规范在 `styles/<文件夹>.md`。STYLE.md 是不变量（画面、配色、字体、运动、镜头语法、声音、禁忌），故事和结构由主题决定，不照搬 demo。知识科普常用：数据叙事 dataviz、白板讲解 whiteboard、瑞士动态排版 swiss-motion、等距信息图 iso-infographic、字幕新闻 caption-news、50s 扁平卡通 midcentury-toon、象形运动图形 pictogram-motion、中国水墨 ink-wash。样片：https://lemomo-ai.github.io/lemo-opuscar/

## 7. 抖音竖屏
1080×1920、30fps（运动多就 60fps）。安全区：顶部 200px、底部 420px、右侧 160px（纵向 900–1500px）不放关键内容；主画面 300–1250px，字幕 1300–1480px，关键数字用主色高亮。必须烧录字幕。片尾放下一集预告和出处，停留 ≥3 秒。

## 8. 中文配音（按优先级）
1. 用户 Mac 上的剪映专业版「文本朗读」（已登录）：豆包系音色。用户偏好纪录片 /《舌尖上的中国》式男声。流程：新建草稿 → 文本 → 每句一个文本片段 → 朗读 → 选音色 → 只导出音频。需要电脑操作权限，由用户批准。
2. ChatCut（用户 Mac 上有，需用户登录）：内置豆包 TTS。
3. edge-tts（微软神经语音 YunjianNeural / YunxiNeural / YunyangNeural），需要连 speech.platform.bing.com，云端容器不通。
4. vidIQ/ElevenLabs：额度少，适合英文。
5. 离线兜底：sherpa-onnx + Kokoro multi-lang v1.1-zh（GitHub release 下载），不建议正式发布。
口播稿防读错：数字写成汉字、单位写读法（毫米汞柱、百分之）、去掉引号括号、高风险多音字换词、每句单独生成、用 Whisper 回听逐字比对。

## 9. 版权
参考只学语法；不抄角色、旋律、镜头、logo、字体；素材只用 CC0 / CC BY / OFL 并写进 CREDITS；改编 CC BY 内容要署名、附许可链接、注明改动和版本日期。