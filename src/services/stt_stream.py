import sys
import io
import os
import logging
from faster_whisper import WhisperModel

# 로그 레벨 설정 (심각한 에러만 출력)
logging.basicConfig(level=logging.ERROR)

def main():
    # 모델 로드 (가장 가벼운 tiny 모델 사용 권장)
    # CPU 환경을 위해 compute_type="int8" 설정
    model_size = "tiny"
    try:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
    except Exception as e:
        print(f"ERROR: Model load failed - {str(e)}", file=sys.stderr)
        sys.exit(1)

    # 텍스트가 변환될 때마다 즉시 출력하기 위한 설정
    sys.stdout.reconfigure(encoding='utf-8')

    # 표준 입력으로부터 바이너리 데이터를 읽어오기 위한 버퍼
    # 여기서는 간단한 구현을 위해 stdin 전체를 처리하는 방식이 아닌, 
    # 특정 규격의 청크 단위로 처리하는 브릿지 로직이 필요함
    # 실제 스트리밍 구현은 복잡하므로, 여기서는 청크별 변환 시뮬레이션 혹은 
    # 주기적 변환 로직을 가이드함.
    
    # 일단은 파일 기반 변환을 스트리밍처럼 느끼게 하는 소켓 연동용 래퍼로 작성
    while True:
        try:
            # 파일 경로 수신 (Node.js에서 파일 경로를 한 줄 단위로 전달한다고 가정)
            line = sys.stdin.readline()
            if not line:
                break
            
            file_path = line.strip()
            if not os.path.exists(file_path):
                continue

            # 변환 수행
            segments, info = model.transcribe(file_path, beam_size=5, language="ko")
            
            for segment in segments:
                # 결과 즉시 출력 및 플러시
                print(segment.text, flush=True)
                
        except Exception as e:
            print(f"ERROR: {str(e)}", file=sys.stderr, flush=True)

if __name__ == "__main__":
    main()
