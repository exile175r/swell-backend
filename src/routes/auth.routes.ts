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

export default router;
