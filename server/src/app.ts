import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { authRoutes } from './modules/auth/authRoutes.js';
import { reportRoutes } from './modules/reports/reportRoutes.js';
import { claimRoutes } from './modules/claims/claimRoutes.js';
import { matchRoutes } from './modules/matches/matchRoutes.js';
import { notificationRoutes } from './modules/notifications/notificationRoutes.js';
import { moderationRoutes } from './modules/moderation/moderationRoutes.js';
import { getMe, updateProfile } from './modules/auth/authController.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Disable x-powered-by to prevent framework fingerprinting
app.disable('x-powered-by');

// Security and parser middlewares
app.use(
  cors({
    origin: [ENV.APP_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve static uploaded photos
app.use('/uploads', express.static(ENV.UPLOAD_DIR));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusFind API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.get('/api/v1/me', authenticate, getMe);
app.patch('/api/v1/me', authenticate, updateProfile);

app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1', reportRoutes); // For /api/v1/categories, /api/v1/locations, /api/v1/upload
app.use('/api/v1', claimRoutes);
app.use('/api/v1', matchRoutes);
app.use('/api/v1', notificationRoutes);
app.use('/api/v1/admin', moderationRoutes);

// Error Handler
app.use(errorHandler);

export default app;
