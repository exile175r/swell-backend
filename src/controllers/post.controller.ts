import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: 게시글 목록 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, following]
 *           default: all
 *     responses:
 *       200:
 *         description: 게시글 목록 반환 성공
 */
export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', filter = 'all' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Current User ID (Prototype / Hardcoded until Auth)
    const currentUserId = '00000000-0000-0000-0000-000000000000';

    let where: any = {};

    // 1. 팔로잉 필터 처리
    if (filter === 'following') {
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followingIds = following.map((f: any) => f.followingId);
      where.userId = { in: followingIds };
    }

    // 2. 게시글 조회 (Reaction 포함)
    const posts = await prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { nickname: true } },
        _count: { select: { comments: true } },
        reactions: true, // 집계를 위해 리액션 포함
      },
    });

    const formattedPosts = posts.map((post: any) => {
      const likes = post.reactions.filter((r: any) => r.type === 'like').length;
      const dislikes = post.reactions.filter((r: any) => r.type === 'dislike').length;

      return {
        id: post.id,
        userId: post.userId,
        nickname: post.user.nickname,
        content: post.content,
        hasVote: post.hasVote,
        createdAt: post.createdAt,
        likes,
        dislikes,
        commentsCount: post._count.comments,
      };
    });

    res.status(200).json(formattedPosts);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: 새 게시글 작성
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               hasVote:
 *                 type: boolean
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 게시글 생성 성공
 */
export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, hasVote, userId } = req.body;

    // Default userId for Prototype (until Auth is implemented)
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';

    const post = await prisma.post.create({
      data: {
        content,
        hasVote: hasVote || false,
        userId: effectiveUserId,
      },
      include: {
        user: { select: { nickname: true } },
      },
    });

    res.status(201).json({
      ...post,
      nickname: post.user.nickname,
    });
  } catch (error) {
    next(error);
  }
};
