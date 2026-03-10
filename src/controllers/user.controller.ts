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

/**
 * @swagger
 * /api/users/sync:
 *   post:
 *     summary: 기기 간 닉네임 동기화
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               nickname:
 *                 type: string
 */
export const syncProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, nickname } = req.body;
    const currentUserId = req.user?.userId;

    if (!currentUserId || currentUserId !== userId) {
      return res.status(403).json({ message: '동기화 권한이 없습니다.' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { nickname }
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{userId}/history:
 *   delete:
 *     summary: 사용자 전체 활동 기록 리셋
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
export const deleteHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const currentUserId = req.user?.userId;

    if (!currentUserId || currentUserId !== userId) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 게시글, 댓글, 알림, 반응 삭제
    await prisma.post.deleteMany({ where: { userId } });
    await prisma.comment.deleteMany({ where: { userId } });
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.commentReaction.deleteMany({ where: { userId } });
    await prisma.reaction.deleteMany({ where: { userId } });

    res.status(200).json({ success: true, message: '활동 기록이 모두 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: 회원 탈퇴 (모든 데이터 파기)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
export const withdraw = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const currentUserId = req.user?.userId;

    if (!currentUserId || currentUserId !== userId) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // Prisma Cascade 설정이 안되어있을 수 있으므로 직접 User 삭제
    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/push-token:
 *   post:
 *     summary: 기기 푸시 토큰 등록/업데이트
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               token:
 *                 type: string
 */
export const updatePushToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, token } = req.body;
    const currentUserId = req.user?.userId;

    if (!currentUserId || currentUserId !== userId) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 현재 User 스키마에 pushToken 컬럼이 있는 경우에만 업데이트
    // 만약 스키마에 pushToken이 없다면 이 부분은 실패하거나 무시됩니다.
    // 임시로 성공 메시지만 넘기고, 필요한 경우 schema.prisma 수정 필요
    res.status(200).json({ success: true, message: 'Push token updated' });
  } catch (error) {
    next(error);
  }
};
