import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ENV } from '../config/env.js';

// Ensure local uploads directory exists as fallback
if (!fs.existsSync(ENV.UPLOAD_DIR)) {
  fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
}

// Allowed image mime types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, and GIF images are allowed.'));
  }
};

// Use memoryStorage so we can stream to Supabase directly
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

/**
 * Uploads an image to Supabase Storage if configured, or falls back to local disk.
 */
export async function saveUploadedFile(
  file: Express.Multer.File
): Promise<{ key: string; url: string }> {
  const ext = path.extname(file.originalname || '.jpg').toLowerCase() || '.jpg';
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileName = `item-${uniqueSuffix}${ext}`;

  // 1. Try uploading to Supabase Storage if credentials exist
  if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const endpoint = `${ENV.SUPABASE_URL}/storage/v1/object/${ENV.SUPABASE_BUCKET}/${fileName}`;
      console.log(`[Storage] Uploading ${fileName} to Supabase Storage bucket "${ENV.SUPABASE_BUCKET}"...`);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': ENV.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': file.mimetype || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: file.buffer,
      });

      if (res.ok) {
        const publicUrl = `${ENV.SUPABASE_URL}/storage/v1/object/public/${ENV.SUPABASE_BUCKET}/${fileName}`;
        console.log(`[Storage] Successfully uploaded to Supabase: ${publicUrl}`);
        return {
          key: publicUrl,
          url: publicUrl,
        };
      } else {
        const errorText = await res.text();
        console.warn(`[Storage] Supabase upload returned status ${res.status}: ${errorText}. Falling back to disk.`);
      }
    } catch (supabaseError) {
      console.warn(`[Storage] Supabase upload failed with error:`, supabaseError);
      console.log(`[Storage] Falling back to local disk storage...`);
    }
  }

  // 2. Fallback: Save to local uploads disk
  const localFilePath = path.join(ENV.UPLOAD_DIR, fileName);
  await fs.promises.writeFile(localFilePath, file.buffer);
  console.log(`[Storage] Saved locally to: ${localFilePath}`);

  return {
    key: fileName,
    url: `/uploads/${fileName}`,
  };
}

export function getPublicImageUrl(fileName: string): string {
  if (!fileName) return '';
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return fileName;
  }
  return `/uploads/${fileName}`;
}
