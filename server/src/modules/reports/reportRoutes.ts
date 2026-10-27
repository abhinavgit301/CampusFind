import { Router, Request, Response } from 'express';
import {
  listReports,
  getReportByPublicId,
  createReport,
  updateReport,
  withdrawReport,
  confirmRecovery,
  getMyReports,
  CATEGORIES,
  CAMPUS_LOCATIONS,
} from './reportController.js';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { uploadMiddleware, saveUploadedFile } from '../../services/storageService.js';

const router = Router();

// Public metadata
router.get('/categories', (_req: Request, res: Response) => {
  res.json({ categories: CATEGORIES });
});

router.get('/locations', (_req: Request, res: Response) => {
  res.json({ locations: CAMPUS_LOCATIONS });
});

// Image upload endpoint
router.post(
  '/upload',
  authenticate,
  uploadMiddleware.single('image'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }
    try {
      const result = await saveUploadedFile(req.file);
      res.json({
        key: result.key,
        url: result.url,
        originalname: req.file.originalname,
        size: req.file.size,
      });
    } catch (err: any) {
      console.error('[Upload] Error saving file:', err);
      res.status(500).json({ error: 'Failed to upload image file' });
    }
  }
);

// Reports
router.get('/me/reports', authenticate, getMyReports);
router.get('/', optionalAuthenticate, listReports);
router.get('/:publicId', optionalAuthenticate, getReportByPublicId);
router.post('/', authenticate, createReport);
router.patch('/:publicId', authenticate, updateReport);
router.post('/:publicId/withdraw', authenticate, withdrawReport);
router.post('/:publicId/confirm-recovery', authenticate, confirmRecovery);

export const reportRoutes = router;
