import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

export interface IAccessTokenPayload {
  sub: string;
  jti: string;
  role: string;
  iss: string;
  aud: string;
  iat?: number;
  exp?: number;
}

export function generateAccessToken(userId: string, role: string): string {
  const jti = crypto.randomUUID();
  const payload: IAccessTokenPayload = {
    sub: userId,
    jti,
    role,
    iss: ENV.JWT_ISSUER,
    aud: ENV.JWT_AUDIENCE,
  };

  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): IAccessTokenPayload {
  try {
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET, {
      issuer: ENV.JWT_ISSUER,
      audience: ENV.JWT_AUDIENCE,
    }) as IAccessTokenPayload;
    return decoded;
  } catch (error) {
    throw error;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
