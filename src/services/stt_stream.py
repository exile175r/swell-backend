import sys
import os
import logging
from faster_whisper import WhisperModel

# 로그 레벨 설정
logging.basicConfig(level=logging.ERROR)

def main():
    # 1. 모델 로드 (캐싱을 위해 메인 루프 밖에서 초기화)
    # CPU 환경에서 최적의 성능을 내기 위해 tiny 모델과 int8 연산 사용
    model_size = "tiny"
    device = "cpu"
    compute_type = "int8"

    try:
        print(f"DEBUG: Loading Whisper model ({model_size})...", file=sys.stderr, flush=True)
        model = WhisperModel(model_size, device=device, compute_type=compute_type)
        print("DEBUG: Model loaded successfully.", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"ERROR: Model load failed - {str(e)}", file=sys.stderr, flush=True)
        sys.exit(1)

    # UTF-8 출력 설정
    if sys.version_info >= (3, 7):
        sys.stdout.reconfigure(encoding='utf-8')

    # 2. 메인 스트리밍 루프
    while True:
        try:
            # Node.js로부터 오디오 파일 경로 수신
            line = sys.stdin.readline()
            if not line:
                break
            
            file_path = line.strip()
            if not file_path:
                continue

            if not os.path.exists(file_path):
                print(f"DEBUG: File not found - {file_path}", file=sys.stderr, flush=True)
                continue

            # 변환 수행 (실시간성을 위해 beam_size 조절 가능)
            segments, info = model.transcribe(
                file_path, 
                beam_size=1,        # 실시간성을 위해 1로 하향 (속도 우선)
                language="ko", 
                without_timestamps=True
            )
            
            # 결과 즉시 출력 및 플러시
            for segment in segments:
                if segment.text.strip():
                    print(segment.text, flush=True)
                
            # 처리 완료 후 임시 파일 삭제 (선택 사항, Node.js에서도 가능)
            # os.remove(file_path)

        except Exception as e:
            print(f"ERROR: Transcription error - {str(e)}", file=sys.stderr, flush=True)

if __name__ == "__main__":
    main()
