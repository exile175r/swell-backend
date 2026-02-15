import { Request, Response, NextFunction } from 'express';

/**
 * 🎤 STT Mock-up
 * 실제 구현 시 Python Faster-Whisper를 child_process로 호출하거나
 * 외부 AI API(OpenAI Whisper 등)를 사용합니다.
 */
/**
 * @swagger
 * /api/stt:
 *   post:
 *     summary: 음성인식(STT) 테스트용 Mock API
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: 변환된 텍스트 반환 성공
 */
export const transcribeAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Prototype에서는 실제 변환 없이 가상 텍스트 반환
    // 실제 파일은 req.file에서 가져올 수 있음 (multer 필요)

    console.log("Audio file received for transcription...");

    // 인공적인 딜레이 (처리 시간 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.status(200).json({
      text: "백엔드에서 음성을 변환한 결과입니다: 오늘 하루는 너울과 함께해서 행복해요."
    });
  } catch (error) {
    next(error);
  }
};
