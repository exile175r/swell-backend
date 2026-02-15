import { Server } from 'socket.io';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const setupSTTSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('🔌 STT Client connected:', socket.id);

    let pythonProcess: ChildProcessWithoutNullStreams | null = null;
    let tempFilePath: string | null = null;

    // 1. 스트리밍 시작
    socket.on('start-stt', () => {
      console.log('🎤 STT Session started');

      // Python 프로세스 실행
      const scriptPath = path.resolve('src/services/stt_stream.py');
      pythonProcess = spawn('python', [scriptPath]);

      pythonProcess.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
          socket.emit('stt-result', { text });
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error('🐍 Python Error:', data.toString());
      });
    });

    // 2. 오디오 데이터(청크) 수신
    socket.on('audio-chunk', (chunk: Buffer) => {
      if (!pythonProcess) return;

      // 간단한 구현을 위해: 청크를 임시 파일에 쓰고 Python에 경로 전달
      // 실제 고성능 스트리밍은 stdin에 직접 raw audio를 스트리밍해야 함
      // 여기서는 빠른 피드백을 위해 0.5~1초 단위의 임시 파일 기반 처리
      try {
        const filename = `stt_${socket.id}_${Date.now()}.webm`;
        tempFilePath = path.join(os.tmpdir(), filename);
        fs.writeFileSync(tempFilePath, chunk);

        // Python 프로세스에 파일 경로 전달
        pythonProcess.stdin.write(tempFilePath + '\n');
      } catch (err) {
        console.error('❌ Chunk process error:', err);
      }
    });

    // 3. 스트리밍 종료
    socket.on('stop-stt', () => {
      console.log('🛑 STT Session stopped');
      if (pythonProcess) {
        pythonProcess.stdin.end();
        pythonProcess.kill();
        pythonProcess = null;
      }
      // 임시 파일 정리 등 (실제 운영시 필요)
    });

    socket.on('disconnect', () => {
      if (pythonProcess) pythonProcess.kill();
      console.log('🔌 STT Client disconnected');
    });
  });
};
