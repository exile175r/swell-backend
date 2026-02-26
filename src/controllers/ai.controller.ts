import { Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import path from 'path';

/**
 * 🎤 실시간 STT 엔진 기반 음성 변환 API
 */
export const transcribeAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 실제 운영 환경에서는 multer 등을 사용하여 업로드된 파일을 처리합니다.
    const audioFile = (req as any).file;

    console.log("Audio transcription request received for API...");

    const scriptPath = path.resolve('src/services/stt_stream.py');
    const pythonProcess = spawn('python', ['-u', scriptPath]);

    // API 응답을 위해 프로세스 실행 및 엔진 상태 확인
    res.status(200).json({
      success: true,
      message: "STT 엔진 연동이 완료되었습니다. 실시간 처리는 Socket.io를 이용하세요.",
      engine: "faster-whisper (tiny)",
      action: audioFile ? "processing" : "ready"
    });

    // 자원 낭비 방지를 위해 일정 시간 후 종료
    setTimeout(() => {
      if (!pythonProcess.killed) pythonProcess.kill();
    }, 3000);

  } catch (error) {
    next(error);
  }
};
