import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   post:
 *     summary: 게시글에 댓글 작성
 *     tags: [Comments]
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
 *             properties:
 *               content:
 *                 type: string
 *               userId:
 *                 type: string
 *               parentId:
 *                 type: integer
 *                 description: 답글인 경우 부모 댓글의 ID
 *     responses:
 *       201:
 *         description: 댓글 생성 성공
 */
export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: postIdStr } = req.params;
    const { content, userId, parentId } = req.body;

    const postId = Number(postIdStr);
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: effectiveUserId,
        parentId: parentId ? Number(parentId) : null,
      },
      include: {
        user: { select: { nickname: true } },
      },
    });

    // 1. 게시글 작성자에게 알림
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== effectiveUserId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'comment',
          message: '누군가 내 글에 댓글을 남겼습니다.',
        },
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}/like:
 *   post:
 *     summary: 댓글 좋아요 토글
 *     tags: [Comments]
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
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 좋아요 상태 변경 성공
 */
export const likeComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const commentId = Number(id);
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';

    const existing = await prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId: effectiveUserId } },
    });

    if (existing) {
      await prisma.commentReaction.delete({
        where: { id: existing.id },
      });
      const likesCount = await prisma.commentReaction.count({ where: { commentId } });
      return res.status(200).json({ success: true, likesCount, isLiked: false });
    }

    await prisma.commentReaction.create({
      data: { commentId, userId: effectiveUserId, type: 'like' },
    });

    // 2. 댓글 작성자에게 알림
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
    if (comment && comment.userId !== effectiveUserId) {
      await prisma.notification.create({
        data: {
          userId: comment.userId,
          type: 'reaction',
          message: '누군가 내 댓글에 공감을 표시했습니다.',
        },
      });
    }

    const likesCount = await prisma.commentReaction.count({ where: { commentId } });
    res.status(200).json({ success: true, likesCount, isLiked: true });
  } catch (error) {
    next(error);
  }
};
