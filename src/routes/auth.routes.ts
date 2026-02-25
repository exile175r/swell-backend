import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/auth/social:
 *   post:
 *     summary: 소셜 로그인/회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               socialId:
 *                 type: string
 *               provider:
 *                 type: string
 *               nickname:
 *                 type: string
 *               birthDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 및 JWT 발급
 */
router.post('/social', authController.socialLogin);

/**
 * @swagger
 * /api/auth/verify-adult:
 *   post:
 *     summary: 무료 성인 인증 (생년월일 기반)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               birthDate:
 *                 type: string
 *                 example: "1990-01-01"
 *     responses:
 *       200:
 *         description: 인증 성공 및 갱신된 JWT 발급
 */
router.post('/verify-adult', authenticate, authController.verifyAdultFree);

/**
 * @swagger
 * /api/auth/callback:
 *   get:
 *     summary: 소셜 로그인 콜백 브릿지 (앱 딥링크 리다이렉트)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: any
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: 앱 딥링크로 리다이렉트
 */
router.get('/callback', (req, res) => {
  const queryParams = new URLSearchParams(req.query as any).toString();
  const deepLink = `swell://oauth?${queryParams}`;

  // 단순 302 대신 HTML 기반 리다이렉트로 더 확실하게 앱 실행 유도
  res.send(`
    <html>
      <head>
        <title>Redirecting to Swell...</title>
        <meta http-equiv="refresh" content="0;url=${deepLink}">
        <script>
          window.location.href = "${deepLink}";
          setTimeout(function() {
            window.close();
          }, 1000);
        </script>
      </head>
      <body style="background-color: #001220; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
        <div style="text-align: center;">
          <h2>Swell 앱으로 돌아가는 중...</h2>
          <p>자동으로 이동하지 않으면 <a href="${deepLink}" style="color: #00ccff;">여기를 클릭</a>하세요.</p>
        </div>
      </body>
    </html>
  `);
});

export default router;
