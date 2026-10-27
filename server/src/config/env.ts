import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  APP_ORIGIN: process.env.APP_ORIGIN || 'http://localhost:5173',

  JWT_ISSUER: process.env.JWT_ISSUER || 'campusfind-api',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'campusfind-web',
  JWT_ACCESS_TTL_SECONDS: parseInt(process.env.JWT_ACCESS_TTL_SECONDS || '900', 10), // 15 mins
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'campusfind_super_secure_access_secret_key_2026_xyz!',

  REFRESH_TOKEN_TTL_DAYS: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10),

  UPLOAD_DIR: path.resolve(process.cwd(), 'uploads'),

  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || 'campusfind-photos',
};

export function validateSecurityConfig(): void {
  if (ENV.NODE_ENV === 'production') {
    if (!ENV.MONGODB_URI || ENV.MONGODB_URI.trim() === '') {
      throw new Error('[Security Fatal] MONGODB_URI must be configured in production.');
    }

    const defaultDevSecret = 'campusfind_super_secure_access_secret_key_2026_xyz!';
    if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === defaultDevSecret) {
      throw new Error(
        '[Security Fatal] Default development JWT_ACCESS_SECRET cannot be used in production. Please set a unique, cryptographically random JWT_ACCESS_SECRET (minimum 32 characters) in your environment variables.'
      );
    }

    if (ENV.JWT_ACCESS_SECRET.length < 32) {
      throw new Error('[Security Fatal] JWT_ACCESS_SECRET must be at least 32 characters long in production.');
    }
  }
}
