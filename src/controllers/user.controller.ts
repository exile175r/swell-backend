import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';
import { generateRandomNickname } from '../utils/nickname.util';

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   get:
 *     summary: 사용자 프로필 조회
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 프로필 정보 반환 성공
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const currentUserId = (req as any).user?.userId;

    // 차단 여부 확인 (본인 프로필이 아닐 경우)
    if (currentUserId && currentUserId !== userId) {
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: currentUserId, blockedId: userId },
            { blockerId: userId, blockedId: currentUserId }
          ]
        }
      });

      if (isBlocked) {
        return res.status(403).json({ message: '차단된 사용자이거나 당신을 차단한 사용자입니다.' });
      }
    }

    // Find or Create guest user
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { posts: true, followers: true, following: true }
        }
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          nickname: generateRandomNickname(),
          bio: '너울과 함께 감정을 나누는 중'
        },
        include: {
          _count: {
            select: { posts: true, followers: true, following: true }
          }
        }
      });
    }

    if (!user) {
      return res.status(500).json({ error: 'User creation failed' });
    }

    res.status(200).json({
      nickname: user.nickname,
      bio: user.bio,
      postCount: user._count.posts,
      followerCount: user._count.followers,
      followingCount: user._count.following,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/follow:
 *   post:
 *     summary: 사용자 팔로우/언팔로우
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followerId:
 *                 type: string
 *               followingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 팔로우 상태 변경 성공
 */
export const followUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { followingId } = req.body;
    const followerId = req.user?.userId;

    if (!followerId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ message: '자기 자신을 팔로우할 수 없습니다.' });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return res.status(200).json({ following: false });
    }

    await prisma.follow.create({
      data: { followerId, followingId }
    });

    // 알림 생성
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: 'follow',
        message: '새로운 사용자가 당신을 팔로우하기 시작했습니다.'
      }
    });

    res.status(200).json({ following: true });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/block:
 *   post:
 *     summary: 사용자 차단/해제
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blockedId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 차단 상태 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blocked:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export const blockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { blockedId } = req.body;
    const blockerId = (req as any).user?.userId;

    if (!blockerId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    if (blockerId === blockedId) {
      return res.status(400).json({ message: '자기 자신을 차단할 수 없습니다.' });
    }

    const existingBlock = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } }
    });

    if (existingBlock) {
      await prisma.block.delete({ where: { id: existingBlock.id } });
      return res.status(200).json({ blocked: false, message: '차단이 해제되었습니다.' });
    }

    // 차단 시 팔로우 관계가 있다면 정리 (양방향)
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId }
        ]
      }
    });

    await prisma.block.create({
      data: { blockerId, blockedId }
    });

    res.status(200).json({ blocked: true, message: '사용자를 차단했습니다.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/blocks:
 *   get:
 *     summary: 차단한 사용자 목록 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 차단 목록 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   nickname: { type: string }
 *                   bio: { type: string }
 */
export const getBlockedUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    const blockedItems = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { id: true, nickname: true, bio: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(blockedItems.map(item => item.blocked));
  } catch (error) {
    next(error);
  }
};
