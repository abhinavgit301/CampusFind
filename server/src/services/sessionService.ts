import { Types } from 'mongoose';
import { AuthSession } from '../models/AuthSession.js';
import { User } from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from './tokenService.js';
import { ENV } from '../config/env.js';

export async function createAuthSession(
  userId: string | Types.ObjectId,
  ipAddress = '',
  userAgent = ''
) {
  const user = await User.findById(userId);
  if (!user || user.status === 'SUSPENDED') {
    throw new Error('Account suspended or invalid');
  }

  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + ENV.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await AuthSession.create({
    userId: user._id,
    refreshTokenHash: tokenHash,
    userAgent,
    ipAddress,
    expiresAt,
    lastUsedAt: new Date(),
  });

  const accessToken = generateAccessToken(user._id.toString(), user.role);

  return {
    session,
    accessToken,
    refreshToken: rawRefreshToken,
    user,
  };
}

export async function rotateAuthSession(
  rawRefreshToken: string,
  ipAddress = '',
  userAgent = ''
) {
  if (!rawRefreshToken) {
    throw new Error('Refresh token is required');
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const session = await AuthSession.findOne({ refreshTokenHash: tokenHash });

  if (!session) {
    throw new Error('Invalid refresh token');
  }

  // Detect reuse of revoked session
  if (session.revokedAt) {
    // Revoke all sessions for this user for security
    await AuthSession.updateMany(
      { userId: session.userId },
      { $set: { revokedAt: new Date() } }
    );
    throw new Error('Session has been revoked. Possible token reuse detected.');
  }

  // Check expiration
  if (new Date() > session.expiresAt) {
    session.revokedAt = new Date();
    await session.save();
    throw new Error('Session expired. Please log in again.');
  }

  const user = await User.findById(session.userId);
  if (!user || user.status === 'SUSPENDED') {
    session.revokedAt = new Date();
    await session.save();
    throw new Error('User suspended or not found');
  }

  // Rotate refresh token
  const newRawRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRawRefreshToken);

  session.refreshTokenHash = newTokenHash;
  session.lastUsedAt = new Date();
  if (ipAddress) session.ipAddress = ipAddress;
  if (userAgent) session.userAgent = userAgent;
  await session.save();

  const newAccessToken = generateAccessToken(user._id.toString(), user.role);

  return {
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
    user,
  };
}

export async function revokeAuthSession(rawRefreshToken: string) {
  if (!rawRefreshToken) return false;
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const session = await AuthSession.findOne({ refreshTokenHash: tokenHash });
  if (session && !session.revokedAt) {
    session.revokedAt = new Date();
    await session.save();
    return true;
  }
  return false;
}

export async function revokeAllSessionsForUser(userId: string | Types.ObjectId) {
  await AuthSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  return true;
}
