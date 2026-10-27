import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User.js';
import {
  createAuthSession,
  rotateAuthSession,
  revokeAuthSession,
  revokeAllSessionsForUser,
} from '../../services/sessionService.js';
import { setAuthCookies, clearAuthCookies } from '../../middleware/cookieHelper.js';
import { ENV } from '../../config/env.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, displayName, hostel, roomNumber, phoneNumber } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Enforce STUDENT role strictly for public registration
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
      hostel: hostel || 'NONE',
      roomNumber: roomNumber ? roomNumber.trim() : '',
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const sessionData = await createAuthSession(user._id, ip, userAgent);
    setAuthCookies(res, sessionData.accessToken, sessionData.refreshToken);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        hostel: user.hostel,
        roomNumber: user.roomNumber,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[AuthController.register] error:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Security Guard: Prevent default development accounts from being used in production
    if (ENV.NODE_ENV === 'production') {
      const devAccounts = ['student@campus.edu', 'finder@campus.edu', 'moderator@campus.edu'];
      if (devAccounts.includes(normalizedEmail)) {
        res.status(403).json({
          error: 'Default development accounts are disabled in production mode. Please use your campus credentials.',
        });
        return;
      }
    }

    const user = await User.findOne({ email: normalizedEmail });

    // Generic error message to prevent account enumeration
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Your account has been suspended. Please contact campus administration.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const sessionData = await createAuthSession(user._id, ip, userAgent);
    setAuthCookies(res, sessionData.accessToken, sessionData.refreshToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        hostel: user.hostel,
        roomNumber: user.roomNumber,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[AuthController.login] error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!refreshToken) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'No refresh token provided.' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const rotated = await rotateAuthSession(refreshToken, ip, userAgent);
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);

    res.json({
      message: 'Session refreshed',
      user: {
        id: rotated.user._id,
        email: rotated.user.email,
        displayName: rotated.user.displayName,
        hostel: rotated.user.hostel,
        roomNumber: rotated.user.roomNumber,
        phoneNumber: rotated.user.phoneNumber,
        role: rotated.user.role,
      },
    });
  } catch (error: any) {
    clearAuthCookies(res);
    res.status(401).json({ error: error.message || 'Session expired or invalid.' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (refreshToken) {
      await revokeAuthSession(refreshToken);
    }
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully.' });
  } catch (error: any) {
    clearAuthCookies(res);
    res.json({ message: 'Logged out.' });
  }
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    await revokeAllSessionsForUser(req.user.id);
    clearAuthCookies(res);
    res.json({ message: 'All active sessions revoked successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to revoke sessions.' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        hostel: user.hostel,
        roomNumber: user.roomNumber,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { displayName, hostel, roomNumber, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (displayName) user.displayName = displayName.trim();
    if (hostel !== undefined) user.hostel = hostel;
    if (roomNumber !== undefined) user.roomNumber = roomNumber.trim();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        hostel: user.hostel,
        roomNumber: user.roomNumber,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
}
