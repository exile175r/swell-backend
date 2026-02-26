import { Server } from 'socket.io';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const setupSTTSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('🔌 STT Client connected:', socket.id);

    let pythonProcess: ChildProcessWithoutNullStreams | null = null;
    const tempFiles: string[] = [];

    // 1. STT 세션 시작 (Python 프로세스 미리 실행)
    socket.on('start-stt', () => {
      console.log('🎤 STT Session started:', socket.id);

      if (pythonProcess) {
        pythonProcess.kill();
      }

      const scriptPath = path.resolve('src/services/stt_stream.py');
      // Python 실행 시 버퍼링 없이 즉시 출력하도록 -u 옵션 사용 권장
      pythonProcess = spawn('python', ['-u', scriptPath]);

      pythonProcess.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
          console.log(`[STT Result ${socket.id}]:`, text);
          socket.emit('stt-result', { text });
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        const errorMsg = data.toString();
        if (errorMsg.includes('ERROR')) {
          console.error('🐍 Python STT Error:', errorMsg);
        } else {
          console.log('🐍 Python STT Debug:', errorMsg.trim());
        }
      });

      pythonProcess.on('close', (code) => {
        console.log(`🐍 Python STT process closed with code ${code}`);
      });
    });

    // 2. 오디오 데이터(청크) 수신 및 처리
    socket.on('audio-chunk', (chunk: Buffer) => {
      if (!pythonProcess || !pythonProcess.stdin.writable) {
        console.warn('⚠️ Python process not ready for chunks');
        return;
      }

      try {
        // 임시 파일 생성 (실제 운영 시에는 메모리 기반 처리가 좋으나, Whisper 특성상 파일 경로 전달이 안정적)
        const filename = `stt_${socket.id}_${Date.now()}.webm`;
        const tempFilePath = path.join(os.tmpdir(), filename);

        fs.writeFileSync(tempFilePath, chunk);
        tempFiles.push(tempFilePath);

        // Python 프로세스에 파일 경로 전달
        pythonProcess.stdin.write(tempFilePath + '\n');
      } catch (err) {
        console.error('❌ Chunk processing error:', err);
      }
    });

    // 3. 스트리밍 종료 및 자원 정리
    const cleanup = () => {
      console.log('🛑 STT Session cleanup:', socket.id);
      if (pythonProcess) {
        pythonProcess.stdin.end();
        pythonProcess.kill();
        pythonProcess = null;
      }

      // 임시 파일 정리
      while (tempFiles.length > 0) {
        const file = tempFiles.pop();
        if (file && fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch (e) {
            console.error('❌ Failed to delete temp file:', file, e);
          }
        }
      }
    };

    socket.on('stop-stt', cleanup);
    socket.on('disconnect', () => {
      cleanup();
      console.log('🔌 STT Client disconnected:', socket.id);
    });
  });
};
