import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service';
import { generateToken } from '../utils/jwt.util';

/**
 * 웹 브라우저 프록시 콜백
 * 카카오/구글에서 로그인 완료 후 ఈ 주소로 리다이렉트 되면,
 * 파라미터를 그대로 보존하여 모바일 앱(swell://oauth)으로 다시 튕겨줌.
 */
export const authProxy = (req: Request, res: Response) => {
  const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
  const appDeepLink = `swell://oauth?${queryParams}`;
  console.log(`[Auth Proxy] Redirecting to App Deep Link: ${appDeepLink}`);
  res.redirect(302, appDeepLink);
};


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * 소셜 로그인 (또는 연동)
 * 프론트엔드에서 인증 후 받은 code를 전달받아 토큰 교환 및 검증 실행
 */
export const socialLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, code, redirectUri, codeVerifier } = req.body;
    console.log(`[Auth] socialLogin started for provider: ${provider}, Code mode.`);
    let { socialId, nickname, birthDate } = req.body;

    if (!provider) {
      return res.status(400).json({ message: 'provider는 필수입니다.' });
    }

    if (!code) {
      return res.status(400).json({ message: '인가 코드(code)가 필수입니다.' });
    }

    let accessToken = "";
    let idToken = "";

    // 1. 카카오인 경우
    if (provider === 'kakao') {
      try {
        console.log(`[Auth] Requesting Kakao Token with Redirect URI: ${redirectUri}`);
        const tokenResponse = await axios.post(
          'https://kauth.kakao.com/oauth/token',
          null,
          {
            params: {
              grant_type: 'authorization_code',
              client_id: process.env.KAKAO_REST_API_KEY?.trim(),
              client_secret: process.env.KAKAO_CLIENT_SECRET?.trim(), // 보안 설정 대비 추가
              redirect_uri: redirectUri,
              code: code,
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
          }
        );
        accessToken = tokenResponse.data.access_token;
      } catch (error: any) {
        console.error('[Kakao Token Error]', error.response?.data || error.message);
        return res.status(401).json({ message: '카카오 인증 코드가 유효하지 않습니다.', error: error.response?.data });
      }

      try {
        console.log('[Auth] Fetching Kakao User Info...');
        const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
        return res.status(401).json({ message: '카카오 사용자 정보 조회 실패.', error: (error as any).message });
      }
    }
    // 2. 구글인 경우
    else if (provider === 'google') {
      try {
        console.log(`[Auth] Requesting Google Token with Redirect URI: ${redirectUri}`);
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: process.env.GOOGLE_CLIENT_ID?.trim(),
          client_secret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier, // PKCE 검증기 필수 (Option 3/4)
        });
        idToken = tokenResponse.data.id_token;
      } catch (error: any) {
        console.error('[Google Token Error]', error.response?.data || error.message);
        return res.status(401).json({ message: '구글 인증 코드가 유효하지 않습니다.', error: error.response?.data });
      }

      try {
        console.log('[Auth] Verifying Google ID Token...');
        const ticket = await googleClient.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID?.trim(),
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error('토큰 정보가 없습니다.');
        }

        socialId = payload.sub; // 구글 고유 ID
        nickname = payload.name || nickname;
      } catch (error) {
        return res.status(401).json({ message: '유효하지 않은 구글 토큰입니다.', error: (error as any).message });
      }
    } else {
      return res.status(400).json({ message: '지원하지 않는 소셜 플랫폼입니다.' });
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
