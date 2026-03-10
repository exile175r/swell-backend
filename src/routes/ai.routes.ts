import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { transcribeAudio } from '../controllers/ai.controller';

import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

/**
 * @swagger
 * /api/stt:
 *   post:
 *     summary: 실시간 STT 엔진 연동 음성 변환 (REST API)
 *     description: |
 *       업로드된 오디오 파일을 Python Faster-Whisper 엔진으로 변환합니다.
 *       실시간 스트리밍 처리는 Socket.io(start-stt)를 권장합니다.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: STT 엔진 준비 및 변환 프로세스 시작
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 engine:
 *                   type: string
 */
router.post('/recognize', authenticate, upload.single('file'), transcribeAudio);

export default router;
