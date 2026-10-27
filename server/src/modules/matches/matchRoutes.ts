import { Router, Request, Response } from 'express';
import { Match } from '../../models/Match.js';
import { Report } from '../../models/Report.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.get('/me/matches', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Find all active reports by this user
    const userReports = await Report.find({
      reporterId: req.user.id,
      status: 'ACTIVE',
    }).select('_id');

    const userReportIds = userReports.map(r => r._id);

    const matches = await Match.find({
      $or: [
        { lostReportId: { $in: userReportIds } },
        { foundReportId: { $in: userReportIds } },
      ],
      status: 'SUGGESTED',
    })
      .sort({ score: -1, createdAt: -1 })
      .populate('lostReportId', 'publicId title description categoryId lastSeenLocation eventAt photoKeys status')
      .populate('foundReportId', 'publicId title description categoryId foundLocation holdingLocation eventAt photoKeys status');

    res.json({ matches });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch matches.' });
  }
});

export const matchRoutes = router;
