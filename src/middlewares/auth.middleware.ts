import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.util';

// Express Request 타입 확장 (user 정보 추가)
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT 토큰 검증 미들웨어
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
  }

  req.user = decoded;
  next();
};

/**
 * 성인 인증 여부 확인 미들웨어
 */
export const requireAdult = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.ageVerified) {
    return res.status(403).json({
      message: '성인 인증이 필요한 기능입니다.',
      code: 'ADULT_VERIFICATION_REQUIRED'
    });
  }
  next();
};
