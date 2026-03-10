import { Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * 🎤 모바일에서 업로드된 파일을 처리하는 REST API 방식의 STT 변환
 */
export const transcribeAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ success: false, message: '오디오 파일 전송이 누락되었습니다.' });
    }

    console.log(`[STT] Audio received. Path: ${audioFile.path}`);

    const scriptPath = path.resolve('src/services/stt_stream.py');
    const pythonProcess = spawn('python', ['-u', scriptPath]);

    let transcribedText = '';
    let errorMessage = '';

    // 파이썬 엔진에 파일 경로 전달
    pythonProcess.stdin.write(audioFile.path + '\n');
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      transcribedText += data.toString('utf-8');
    });

    pythonProcess.stderr.on('data', (data) => {
      const errLine = data.toString('utf-8');
      if (errLine.includes('ERROR:')) {
        errorMessage += errLine;
      }
      console.log(`[Python STDERR]: ${errLine}`);
    });

    pythonProcess.on('close', (code) => {
      // 변환 완료 후 임시 오디오 파일 삭제
      fs.unlink(audioFile.path, (err) => {
        if (err) console.error(`[STT] Temp file deletion failed: ${err.message}`);
      });

      if (code !== 0 || errorMessage) {
        console.error(`[STT] Child process exited with code ${code}. Error: ${errorMessage}`);
        return res.status(500).json({
          success: false,
          message: '음성 변환 과정에서 파이썬 엔진 에러가 발생했습니다.',
        });
      }

      res.status(200).json({
        success: true,
        text: transcribedText.trim(),
      });
    });

    pythonProcess.on('error', (err) => {
      // 프로세스 시작 자체 실패 시점
      fs.unlink(audioFile.path, () => { });
      console.error(`[STT] Failed to start subprocess.`, err);
      res.status(500).json({
        success: false,
        message: '음성 변환 프로세스를 실행할 수 없습니다.',
      });
    });

  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => { });
    next(error);
  }
};
