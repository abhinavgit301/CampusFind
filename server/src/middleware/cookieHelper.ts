import { Response } from 'express';
import { ENV } from '../config/env.js';

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = ENV.NODE_ENV === 'production';

  // Access token cookie (15 mins)
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: ENV.JWT_ACCESS_TTL_SECONDS * 1000,
    path: '/',
  });

  // Refresh token cookie (7 days, scoped)
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: ENV.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export function clearAuthCookies(res: Response) {
  const isProd = ENV.NODE_ENV === 'production';

  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
}
