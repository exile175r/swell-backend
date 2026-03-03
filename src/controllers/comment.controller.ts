import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';
import { filterContent, checkRateLimit, checkRepeatedChars } from '../utils/filter';

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
    const { content, parentId } = req.body;

    const postId = Number(postIdStr);
    const effectiveUserId = req.user?.userId;

    if (!effectiveUserId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    // 도배 방지 체크 (1분 내 5개 제한)
    if (!(await checkRateLimit(effectiveUserId, 'comment'))) {
      return res.status(429).json({ message: '과도한 댓글 작성이 감지되었습니다. 잠시 후 다시 시도해주세요.' });
    }

    // 반복 문자 체크 (10회 이상 동일 문자)
    if (checkRepeatedChars(content)) {
      return res.status(400).json({ message: '부적절한 반복 문자가 포함되어 있습니다.' });
    }

    // 비속어 마스킹 처리
    const maskedContent = await filterContent(content);

    const comment = await (prisma as any).comment.create({
      data: {
        content,
        maskedContent,
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
 * /api/posts/{id}/comments:
 *   get:
 *     summary: 게시글의 댓글 목록 조회
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 댓글 목록 반환 성공
 */
export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const postId = Number(id);
    const currentUserId = req.user?.userId;

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { nickname: true } },
      },
    });

    const formattedComments = comments.map((comment: any) => {
      // 작성자 본인이면 원본 보임, 아니면 마스킹된 내용 보임
      const contentToShow = (currentUserId === comment.userId)
        ? comment.content
        : (comment.maskedContent || comment.content);

      return {
        ...comment,
        content: contentToShow,
      };
    });

    res.status(200).json(formattedComments);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}/like:
// ... (rest of file)
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
    const commentId = Number(id);
    const effectiveUserId = req.user?.userId;

    if (!effectiveUserId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

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
