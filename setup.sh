#!/bin/sh
# 首次使用：安装依赖（Python 虚拟环境、无头 Chromium、离线中文语音识别模型）。在本文件夹里运行：sh setup.sh
set -e
cd "$(dirname "$0")"
command -v ffmpeg >/dev/null || { [ -x "$HOME/bin/ffmpeg" ] && export PATH="$HOME/bin:$PATH"; } || true
command -v ffmpeg >/dev/null || { echo "需要 ffmpeg：brew install ffmpeg"; exit 1; }
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q playwright numpy scipy soundfile soxr sherpa-onnx pillow fonttools
.venv/bin/python -m playwright install chromium
M=sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17
mkdir -p models
[ -d "models/$M" ] || curl -L "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/$M.tar.bz2" | tar xj -C models
echo "安装完成。试一下：./build.sh ep01 stills 3 20 55"
