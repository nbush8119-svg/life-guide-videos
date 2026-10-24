#!/bin/sh
# 一条命令出片。用法：
#   ./build.sh ep03            全流程：配音 → 时间线 → 配乐 → 音效事件 → 混音 → 渲染 → 合成 → 封面 → 交付
#   ./build.sh ep03 <步骤>     单步：voice | align | timeline | music | mix | stills [秒...] | render | mux | cover | deliver
# 配音（本地 Qwen3-TTS，全系列一个旁白音色）：
#   ./build.sh voice-design [候选数]   生成候选音色 → voices/candidates/ 逐个试听
#   ./build.sh voice-pick <编号>       选定旁白音色（只需做一次）
#   ./build.sh ep03 voice [--redo hook:0,belt:2]   逐句配音 + 回听核对（只重做改过的句子）
# 配乐（本地 ACE-Step XL）：
#   ./build.sh ep03 music [--cands 3 | --use 2]    生成本集配乐；script.json 里 "music": {"off": true} 可关闭
# 有 vo/take.* 的集（外部整段配音）仍走原来的 align 切分。
set -e
ROOT=$(cd "$(dirname "$0")" && pwd); cd "$ROOT"
PY=${PY:-$( [ -x .venv/bin/python ] && echo .venv/bin/python || echo python3 )}
AUDIO_STACK=${AUDIO_STACK:-"$HOME/Documents/ChatGPT/kindle/audio-stack"}; export AUDIO_STACK
PY_TTS="$AUDIO_STACK/.venv/bin/python"; PY_ACE="$AUDIO_STACK/ACE-Step-1.5/.venv/bin/python"
need() { [ -x "$1" ] || { echo "找不到 $1（AUDIO_STACK=$AUDIO_STACK）"; exit 1; }; }
case "$1" in
  voice-design) need "$PY_TTS"; exec "$PY_TTS" engine/voice_local.py design ${2:-6} ;;
  voice-pick)   need "$PY_TTS"; exec "$PY_TTS" engine/voice_local.py pick "$2" ;;
  ""|-h|--help) sed -n 2,12p "$0"; exit 0 ;;
esac
EP=episodes/$1; STEP=${2:-all}; [ $# -ge 2 ] && shift 2 || shift 1
[ -f "$EP/script.json" ] || { echo "找不到 $EP/script.json"; exit 1; }
NAME=$($PY -c "import json;d=json.load(open('$EP/script.json'));print('EP%02d_%s' % (d['ep'], d['title']))")
MUSIC_OFF=$($PY -c "import json;print(json.load(open('$EP/script.json')).get('music',{}).get('off',False))")
ARGS="$*"
step() {
  case $1 in
    voice)    need "$PY_TTS"; "$PY_TTS" engine/voice_local.py ep "$EP" $ARGS ;;
    align)    $PY engine/align.py "$EP" ;;
    timeline) $PY engine/timeline.py "$EP" && $PY engine/cues.py "$EP" ;;
    music)    need "$PY_ACE"; "$PY_ACE" engine/music_local.py "$EP" $ARGS ;;
    mix)      $PY engine/render.py "$EP" events && $PY engine/mix.py "$EP" ;;
    stills)   $PY engine/render.py "$EP" stills ${ARGS:-3 15 30 45 60 75 90 105 120 135} ;;
    render)   $PY engine/render.py "$EP" video 30 ;;
    mux)      sh engine/mux.sh "$EP/out/video.mp4" "$EP/out/mix.wav" "$EP/out/$NAME.mp4" ;;
    cover)    $PY engine/cover.py "$EP" ;;
    deliver)  $PY engine/deliver.py "$EP" ;;
    *) echo "未知步骤：$1"; exit 1 ;;
  esac
}
if [ "$STEP" = all ]; then
  ARGS=""
  if ls "$EP"/vo/take.* >/dev/null 2>&1; then
    [ -d "$EP/vo/lines" ] && [ "$(ls $EP/vo/lines | wc -l)" -gt 0 ] || { echo "== align"; step align; }
  else echo "== voice"; step voice; fi
  echo "== timeline"; step timeline
  if [ "$MUSIC_OFF" = True ]; then echo "== music（本集关闭，用代码合成铺底）"
  elif [ -x "$PY_ACE" ]; then echo "== music"; step music
  else echo "== music（未找到 ACE-Step，用代码合成铺底）"; fi
  for s in mix render mux cover deliver; do echo "== $s"; step $s; done
  echo "完成：$EP/out/$NAME.mp4"
else step "$STEP"; fi
