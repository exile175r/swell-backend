import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupSTTSocket } from './services/stt.socket';
import prisma from './services/prisma.service';

const PORT = process.env.PORT || 8080;

// 1. HTTP 서버 생성 (Express 앱 래핑)
const server = http.createServer(app);

// 2. Socket.io 서버 초기화 및 CORS 설정
const io = new Server(server, {
  cors: {
    origin: "*", // 개발 환경을 위해 모든 오리진 허용
    methods: ["GET", "POST"]
  }
});

// 3. STT 소켓 로직 설정
setupSTTSocket(io);

// 4. DB 연결 확인 및 서버 실행
async function startServer() {
  try {
    console.log('  📡 Connecting to Database...');
    await prisma.$connect();
    console.log('  ✅ Database Connection Successful!');
  } catch (error: any) {
    console.error('  ❌ Database Connection Failed!');
    console.error('  Details:', error.message);
    // Render에서 배포 중단 방지를 위해 일단 계속 진행하지만 로그는 남김
  }

  server.listen(PORT, () => {
    console.log(`
    🌊 Swell Backend Server is running!
    🚀 Port: ${PORT}
    🔗 Health Check: http://localhost:${PORT}/health
    📡 WebSocket: Ready for STT streaming
    `);
  });
}

startServer();
