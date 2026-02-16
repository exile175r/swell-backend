import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';
import { generateToken } from '../utils/jwt.util';

/**
 * 소셜 로그인 (또는 연동)
 * 프론트엔드에서 소셜 인증 후 받은 accessToken을 전달받음
 */
export const socialLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, accessToken } = req.body;
    let { socialId, nickname, birthDate } = req.body;

    if (!provider) {
      return res.status(400).json({ message: 'provider는 필수입니다.' });
    }

    // 1. 카카오인 경우 실시간 토큰 검증
    if (provider === 'kakao') {
      if (!accessToken) {
        return res.status(400).json({ message: '카카오 로그인에는 accessToken이 필수입니다.' });
      }

      try {
        const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        });

        const kakaoData = kakaoResponse.data;
        socialId = kakaoData.id.toString();
        nickname = kakaoData.properties?.nickname || nickname;

        // 카카오 계정 설정에 따라 생일 정보가 있을 수 있음 (optional)
        if (kakaoData.kakao_account?.birthyear && kakaoData.kakao_account?.birthday) {
          birthDate = `${kakaoData.kakao_account.birthyear}-${kakaoData.kakao_account.birthday.slice(0, 2)}-${kakaoData.kakao_account.birthday.slice(2)}`;
        }
      } catch (error) {
        return res.status(401).json({ message: '유효하지 않은 카카오 토큰입니다.', error: (error as any).message });
      }
    }

    if (!socialId) {
      return res.status(400).json({ message: 'socialId를 확인할 수 없습니다.' });
    }

    // 2. 기존 사용자 조회 또는 생성 (Upsert)
    let user = await prisma.user.findUnique({
      where: { socialId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          socialId,
          provider,
          nickname: nickname || `User_${Math.floor(Math.random() * 10000)}`,
          birthDate: birthDate || null,
          ageVerified: false
        }
      });
    }

    // 2. JWT 토큰 발행
    const token = generateToken({
      userId: user.id,
      ageVerified: user.ageVerified
    });

    res.status(200).json({
      message: '로그인 성공',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 무료 성인 인증 (소셜 프로필 생년월일 기반)
 */
export const verifyAdultFree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { birthDate } = req.body; // YYYY-MM-DD 형식

    if (!userId) return res.status(401).json({ message: '인증이 필요합니다.' });
    if (!birthDate) return res.status(400).json({ message: '생년월일이 필요합니다.' });

    // 만 19세 계산 로직
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    const isAdult = age >= 19;

    if (isAdult) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ageVerified: true,
          birthDate: birthDate
        }
      });

      // 새로운 상태의 토큰 재발행
      const token = generateToken({
        userId: updatedUser.id,
        ageVerified: true
      });

      res.status(200).json({
        message: '성인 인증 성공',
        token,
        user: updatedUser
      });
    } else {
      res.status(403).json({
        message: '만 19세 미만은 인증할 수 없습니다.',
        age
      });
    }
  } catch (error) {
    next(error);
  }
};
