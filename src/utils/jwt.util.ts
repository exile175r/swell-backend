import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'swell-secret-key-12345';
const EXPIRES_IN = '7d'; // 토큰 만료 기간 (7일)

export interface JwtPayload {
  userId: string;
  ageVerified: boolean;
}

/**
 * JWT 토큰 생성
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
};

/**
 * JWT 토큰 검증
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};
