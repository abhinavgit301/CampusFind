import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/tokenService.js';
import { User, IUser } from '../models/User.js';

export interface AuthenticatedUser {
  id: string;
  role: string;
  email: string;
  displayName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function extractToken(req: Request): string | null {
  // Check cookies first
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    
    // Live account check from DB
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'Account not found. Please log in again.' });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Account has been suspended. Contact campus administration.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      displayName: user.displayName,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.status === 'ACTIVE') {
      req.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        displayName: user.displayName,
      };
    }
  } catch (_e) {
    // Ignore invalid tokens for optional auth
  }
  next();
}
