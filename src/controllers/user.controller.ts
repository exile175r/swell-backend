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
    const { followerId, followingId } = req.body;

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
