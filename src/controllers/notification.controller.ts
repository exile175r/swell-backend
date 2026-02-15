import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: 내 알림 목록 조회
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 알림 목록 반환 성공
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string || '00000000-0000-0000-0000-000000000000';

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};
