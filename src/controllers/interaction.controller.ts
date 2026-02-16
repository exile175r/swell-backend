import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';

/**
 * @swagger
 * /api/posts/{id}/reaction:
 *   post:
 *     summary: 게시글 반응(좋아요/싫어요) 남기기
 *     tags: [Interactions]
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
 *               type:
 *                 type: string
 *                 enum: [like, dislike]
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 반응 저장 성공
 */
export const reactToPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // type: 'like' | 'dislike'

    const postId = Number(id);
    const effectiveUserId = req.user?.userId;

    if (!effectiveUserId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    // Upsert reaction (toggle logic can be added later)
    await prisma.reaction.upsert({
      where: {
        postId_userId: { postId, userId: effectiveUserId },
      },
      update: { type },
      create: { postId, userId: effectiveUserId, type },
    });

    const likes = await prisma.reaction.count({ where: { postId, type: 'like' } });
    const dislikes = await prisma.reaction.count({ where: { postId, type: 'dislike' } });

    // 알림 생성
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== effectiveUserId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'reaction',
          message: `누군가 내 글에 반응('${type}')을 남겼습니다.`,
        },
      });
    }

    res.status(200).json({ success: true, likes, dislikes });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{id}/vote:
 *   post:
 *     summary: 게시글 투표하기
 *     tags: [Interactions]
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
 *               voteType:
 *                 type: string
 *                 enum: [agree, disagree]
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 투표 저장 성공
 */
export const votePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // voteType: 'agree' | 'disagree'

    const postId = Number(id);
    const effectiveUserId = req.user?.userId;

    if (!effectiveUserId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    await prisma.vote.upsert({
      where: {
        postId_userId: { postId, userId: effectiveUserId },
      },
      update: { type: voteType },
      create: { postId, userId: effectiveUserId, type: voteType },
    });

    const agree = await prisma.vote.count({ where: { postId, type: 'agree' } });
    const disagree = await prisma.vote.count({ where: { postId, type: 'disagree' } });

    // 알림 생성
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== effectiveUserId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'reaction',
          message: `누군가 내 투표글에 의견('${voteType}')을 남겼습니다.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      voteData: { agree, disagree, total: agree + disagree },
    });
  } catch (error) {
    next(error);
  }
};
