import { Router } from 'express';
import {
  submitClaim,
  getClaimsForReport,
  getMyClaims,
  reviewClaim,
} from './claimController.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.get('/me/claims', authenticate, getMyClaims);
router.post('/reports/:publicId/claims', authenticate, submitClaim);
router.get('/reports/:publicId/claims', authenticate, getClaimsForReport);
router.patch('/claims/:id/review', authenticate, reviewClaim);

export const claimRoutes = router;
