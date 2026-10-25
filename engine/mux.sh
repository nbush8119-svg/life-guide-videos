#!/bin/sh
# 合成成片：两遍响度标准化到 -14 LUFS / -1.5 dBTP。用法：sh engine/mux.sh video.mp4 mix.wav out.mp4
set -e
V=$1; A=$2; O=$3
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | python3 -c "import sys,re;print(re.search(r'\{[^{}]*\}',sys.stdin.read()).group(0))")
mi=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
set -- $mi
ffmpeg -y -v error -i "$V" -i "$A" -filter_complex \
 "[0:v]format=yuv420p[v];[1:a]loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${1}:measured_TP=${2}:measured_LRA=${3}:measured_thresh=${4}:offset=${5}:linear=true,aresample=48000[a]" \
 -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 19 -profile:v high -c:a aac -b:a 192k -movflags +faststart -shortest "$O"
ffmpeg -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
