import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';
import { generateToken } from '../utils/jwt.util';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // 1. 카카오인 경우
    if (provider === 'kakao') {
      if (!accessToken) {
        return res.status(400).json({ message: '카카오 로그인에는 인가 코드(또는 토큰)가 필수입니다.' });
      }

      let realToken = accessToken;

      // 만약 넘어온 값이 '인가 코드'라면 (길이가 짧거나 특정 패턴일 경우 교환 시도)
      // 현재 프론트엔드에서 responseType: 'code'로 보내기로 했으므로 무조건 교환 시도
      try {
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
          params: {
            grant_type: 'authorization_code',
            client_id: process.env.KAKAO_REST_API_KEY,
            client_secret: process.env.KAKAO_CLIENT_SECRET,
            redirect_uri: req.body.redirectUri || 'https://swell-backend.onrender.com/api/auth/callback',
            code: accessToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        });
        realToken = tokenResponse.data.access_token;
      } catch (error: any) {
        console.error('[Kakao Token Exchange Error]', error.response?.data || error.message);
        // 이미 토큰일 수도 있으므로 실패해도 계속 진행해봄 (또는 명확히 에러 처리)
      }

      try {
        const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${realToken}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        });

        const kakaoData = kakaoResponse.data;
        socialId = kakaoData.id.toString();
        nickname = kakaoData.properties?.nickname || nickname;

        if (kakaoData.kakao_account?.birthyear && kakaoData.kakao_account?.birthday) {
          birthDate = `${kakaoData.kakao_account.birthyear}-${kakaoData.kakao_account.birthday.slice(0, 2)}-${kakaoData.kakao_account.birthday.slice(2)}`;
        }
      } catch (error) {
        return res.status(401).json({ message: '유효하지 않은 카카오 토큰입니다.', error: (error as any).message });
      }
    }

    // 2. 구글인 경우
    if (provider === 'google') {
      if (!accessToken) {
        return res.status(400).json({ message: '구글 로그인에는 인가 코드가 필수입니다.' });
      }

      let idToken = accessToken;

      // 구글 인가 코드를 ID 토큰으로 교환
      try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          code: accessToken,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: req.body.redirectUri || 'https://swell-backend.onrender.com/api/auth/callback',
          grant_type: 'authorization_code',
        });
        idToken = tokenResponse.data.id_token;
      } catch (error: any) {
        console.error('[Google Token Exchange Error]', error.response?.data || error.message);
        // 이미 id_token일 가능성도 있으므로 유지
      }

      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error('토큰 정보가 없습니다.');
        }

        socialId = payload.sub; // 구글 고유 ID
        nickname = payload.name || nickname;
        // 구글은 기본적으로 생년월일을 주지 않으므로, 요청 페이로드의 birthDate를 유지하거나 나중에 입력받음
      } catch (error) {
        return res.status(401).json({ message: '유효하지 않은 구글 토큰입니다.', error: (error as any).message });
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
      success: true,
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
        success: true,
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
