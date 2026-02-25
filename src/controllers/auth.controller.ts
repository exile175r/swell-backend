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
    console.log(`[Auth] socialLogin started for provider: ${provider}`);
    let { socialId, nickname, birthDate } = req.body;

    if (!provider) {
      return res.status(400).json({ message: 'provider는 필수입니다.' });
    }

    // 1. 카카오인 경우
    if (provider === 'kakao') {
      console.log('[Auth] Processing Kakao Login...');
      if (!accessToken) {
        return res.status(400).json({ message: '카카오 로그인에는 인가 코드가 필수입니다.' });
      }

      let realToken = accessToken;

      try {
        const apiKey = process.env.KAKAO_REST_API_KEY;
        const clientSecret = process.env.KAKAO_CLIENT_SECRET;

        if (!apiKey || !clientSecret) {
          console.error('[Auth] Kakao API Key or Client Secret is missing in Environment Variables');
          return res.status(500).json({
            success: false,
            message: '서버 환경 설정(Kakao API Key/Secret)이 누락되었습니다. 관리자에게 문의하세요.',
            details: { apiKey: !!apiKey, clientSecret: !!clientSecret }
          });
        }

        const targetRedirectUri = req.body.redirectUri || 'https://swell-backend.onrender.com/api/auth/callback';
        console.log(`[Auth] Exchanging Kakao Code for Token. Code: ${accessToken.substring(0, 10)}..., RedirectURI: ${targetRedirectUri}`);
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
          params: {
            grant_type: 'authorization_code',
            client_id: apiKey,
            client_secret: clientSecret,
            redirect_uri: targetRedirectUri,
            code: accessToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        });
        realToken = tokenResponse.data.access_token;
        console.log('[Auth] Kakao Token Exchange Success');
      } catch (error: any) {
        const errorDetail = error.response?.data || error.message;
        console.error('[Kakao Token Exchange Error]', errorDetail);
        return res.status(401).json({
          success: false,
          message: '카카오 토큰 교환에 실패했습니다.',
          error: errorDetail
        });
      }

      try {
        console.log('[Auth] Fetching Kakao User Info...');
        const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${realToken}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        });

        const kakaoData = kakaoResponse.data;
        socialId = kakaoData.id.toString();
        nickname = kakaoData.properties?.nickname || nickname;
        console.log(`[Auth] Kakao User Info Fetched: ${socialId}`);

        if (kakaoData.kakao_account?.birthyear && kakaoData.kakao_account?.birthday) {
          birthDate = `${kakaoData.kakao_account.birthyear}-${kakaoData.kakao_account.birthday.slice(0, 2)}-${kakaoData.kakao_account.birthday.slice(2)}`;
        }
      } catch (error) {
        console.error('[Kakao User Me Error]', (error as any).message);
        return res.status(401).json({ message: '유효하지 않은 카카오 토큰입니다.', error: (error as any).message });
      }
    }

    // 2. 구글인 경우
    if (provider === 'google') {
      console.log('[Auth] Processing Google Login...');
      if (!accessToken) {
        return res.status(400).json({ message: '구글 로그인에는 인가 코드가 필수입니다.' });
      }

      let idToken = accessToken;

      try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          console.error('[Auth] Google Client ID or Secret is missing in Environment Variables');
          return res.status(500).json({
            success: false,
            message: '서버 환경 설정(Google Client ID/Secret)이 누락되었습니다.',
            details: { clientId: !!clientId, clientSecret: !!clientSecret }
          });
        }

        console.log('[Auth] Exchanging Google Code for Token...');
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          code: accessToken,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: req.body.redirectUri || 'https://swell-backend.onrender.com/api/auth/callback',
          grant_type: 'authorization_code',
        });
        idToken = tokenResponse.data.id_token;
        console.log('[Auth] Google Token Exchange Success');
      } catch (error: any) {
        const errorDetail = error.response?.data || error.message;
        console.error('[Google Token Exchange Error]', errorDetail);
        return res.status(401).json({
          success: false,
          message: '구글 토큰 교환에 실패했습니다.',
          error: errorDetail
        });
      }

      try {
        console.log('[Auth] Verifying Google ID Token...');
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
      console.error('[Auth] socialId is missing after all checks');
      return res.status(400).json({ message: 'socialId를 확인할 수 없습니다.' });
    }

    // 2. 기존 사용자 조회 또는 생성 (Upsert)
    console.log(`[Auth] Searching for user in DB with socialId: ${socialId}`);
    let user = await prisma.user.findUnique({
      where: { socialId }
    });

    if (!user) {
      console.log(`[Auth] User not found, creating new user for ${provider}...`);
      try {
        user = await prisma.user.create({
          data: {
            socialId,
            provider,
            nickname: nickname || `User_${Math.floor(Math.random() * 10000)}`,
            birthDate: birthDate || null,
            ageVerified: false
          }
        });
        console.log(`[Auth] New user created: ${user.id}`);
      } catch (dbError: any) {
        console.error('[Auth] Database Create Error:', dbError.message);
        throw dbError;
      }
    } else {
      console.log(`[Auth] Existing user found: ${user.id}`);
    }

    // 2. JWT 토큰 발행
    console.log('[Auth] Generating JWT Token...');
    const token = generateToken({
      userId: user.id,
      ageVerified: user.ageVerified
    });

    res.status(200).json({
      success: true,
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        status: user.membership || 'USER',
        ageVerified: user.ageVerified
      }
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
