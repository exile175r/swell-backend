import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: 신고 접수 (게시글, 댓글, 사용자)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, targetId, category]
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [USER, POST, COMMENT]
 *               targetId:
 *                 type: string
 *               category:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: 신고 접수 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 reportId: { type: integer }
 *                 cumulativeReports: { type: integer }
 */
export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetType, targetId, category, reason } = req.body;
    const reporterId = (req as any).user?.userId;

    if (!reporterId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    // 대상에 따른 피신고자(reportedUserId) 찾기
    let reportedUserId = '';

    if (targetType === 'USER') {
      reportedUserId = targetId;
    } else if (targetType === 'POST') {
      const post = await prisma.post.findUnique({ where: { id: Number(targetId) } });
      if (!post) return res.status(404).json({ message: '해당 게시글을 찾을 수 없습니다.' });
      reportedUserId = post.userId;
    } else if (targetType === 'COMMENT') {
      const comment = await prisma.comment.findUnique({ where: { id: Number(targetId) } });
      if (!comment) return res.status(404).json({ message: '해당 댓글을 찾을 수 없습니다.' });
      reportedUserId = comment.userId;
    }

    if (!reportedUserId) {
      return res.status(400).json({ message: '피신고자를 식별할 수 없습니다.' });
    }

    const report = await prisma.report.create({
      data: {
        targetType,
        targetId,
        reporterId,
        reportedUserId,
        category,
        reason,
      },
    });

    // 해당 유저의 누적 신고 횟수 확인
    const totalReports = await prisma.report.count({
      where: { reportedUserId }
    });

    res.status(201).json({
      success: true,
      reportId: report.id,
      cumulativeReports: totalReports,
      message: '신고가 정상적으로 접수되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: 신고 목록 조회 (관리자용)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 신고 목록 반환 성공
 */
export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: 관리자 권한 체크 로직 (예: req.user.role === 'ADMIN')

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { nickname: true } },
        reportedUser: { select: { nickname: true } }
      }
    });

    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/reports/{id}/action:
 *   patch:
 *     summary: 신고 처리 및 관리자 조치 (관리자용)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, adminAction]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [RESOLVED, REJECTED]
 *               adminAction:
 *                 type: string
 *                 enum: [WARNING, BAN_7, BAN_PERMANENT, NONE]
 *     responses:
 *       200:
 *         description: 조치 완료 성공
 */
export const updateReportAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, adminAction } = req.body;

    const report = await prisma.report.update({
      where: { id: Number(id) },
      data: { status, adminAction }
    });

    // 조치 완료 후 알림 전송 등의 후속 로직을 여기에 추가할 수 있습니다.

    res.status(200).json({ success: true, report, message: '관리자 조치가 반영되었습니다.' });
  } catch (error) {
    next(error);
  }
};
