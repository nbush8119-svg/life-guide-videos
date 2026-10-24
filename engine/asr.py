"""离线中文语音识别（SenseVoice，sherpa-onnx）。模型由 setup.sh 下载到 models/。"""
import sys, os, sherpa_onnx, soundfile as sf, soxr
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17")
rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(model=f"{D}/model.int8.onnx", tokens=f"{D}/tokens.txt", use_itn=False, num_threads=2, language="zh")
def transcribe(path):
    a, sr = sf.read(path, dtype="float32")
    if a.ndim > 1: a = a.mean(1)
    if sr != 16000: a = soxr.resample(a, sr, 16000)
    s = rec.create_stream(); s.accept_waveform(16000, a); rec.decode_stream(s)
    return s.result.text, list(zip(s.result.tokens, s.result.timestamps))
if __name__ == "__main__":
    for p in sys.argv[1:]: print(p, transcribe(p)[0])
