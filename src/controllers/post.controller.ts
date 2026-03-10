import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';
import { filterContent, checkRateLimit, checkRepeatedChars } from '../utils/filter';

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

    // Current User ID from JWT
    const currentUserId = req.user?.userId;

    // 1. 차단 유저 필터링 (내가 차단했거나 나를 차단한 유저 제외)
    let blockedIds: string[] = [];
    if (currentUserId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: currentUserId },
            { blockedId: currentUserId }
          ]
        },
        select: { blockerId: true, blockedId: true },
      });
      blockedIds = blocks.map((b: any) => b.blockerId === currentUserId ? b.blockedId : b.blockerId);
    }

    let where: any = {};
    if (blockedIds.length > 0) {
      where.userId = { notIn: blockedIds };
    }

    // 2. 팔로잉 필터 처리
    if (filter === 'following' && currentUserId) {
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followingIds = following.map((f: any) => f.followingId);

      // 차단된 유저 제외
      const finalFollowingIds = followingIds.filter((id: string) => !blockedIds.includes(id));
      where.userId = { in: finalFollowingIds };
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

      // 작성자 본인이면 원본 보임, 아니면 마스킹된 내용 보임
      const contentToShow = (currentUserId === post.userId)
        ? post.content
        : (post.maskedContent || post.content);

      return {
        id: post.id,
        userId: post.userId,
        nickname: post.user.nickname,
        content: contentToShow,
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
    const { content, hasVote } = req.body;
    const effectiveUserId = req.user?.userId;

    if (!effectiveUserId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    // 도배 방지 체크 (1분 내 5개 제한)
    if (!(await checkRateLimit(effectiveUserId, 'post'))) {
      return res.status(429).json({ message: '과도한 게시글 작성이 감지되었습니다. 잠시 후 다시 시도해주세요.' });
    }

    // 반복 문자 체크 (10회 이상 동일 문자)
    if (checkRepeatedChars(content)) {
      return res.status(400).json({ message: '부적절한 반복 문자가 포함되어 있습니다.' });
    }

    // 비속어 마스킹 처리
    const maskedContent = await filterContent(content);

    const post = await (prisma as any).post.create({
      data: {
        content,
        maskedContent,
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

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: 게시글 수정
 *     tags: [Posts]
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
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: 게시글 수정 성공
 */
export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: postIdStr } = req.params;
    const { content, title } = req.body;
    const postId = Number(postIdStr);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: '수정 권한이 없습니다.' });
    }

    const maskedContent = await filterContent(content);

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content, maskedContent },
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: 게시글 삭제
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
 */
export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: postIdStr } = req.params;
    const postId = Number(postIdStr);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await prisma.post.delete({ where: { id: postId } });
    res.status(200).json({ success: true, message: '게시글이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};
