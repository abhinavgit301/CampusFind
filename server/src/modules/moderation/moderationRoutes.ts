import { Router, Request, Response } from 'express';
import { Report } from '../../models/Report.js';
import { User } from '../../models/User.js';
import { Claim } from '../../models/Claim.js';
import { AuditLog } from '../../models/AuditLog.js';
import { Notification } from '../../models/Notification.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { revokeAllSessionsForUser } from '../../services/sessionService.js';

const router = Router();

// Strictly enforce MODERATOR role
router.use(authenticate, requireRole('MODERATOR'));

// List all reports with admin filters
router.get('/reports', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;
    const query: any = {};
    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.reportType = type;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate('reporterId', 'displayName email phoneNumber role status');

    res.json({ reports });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admin reports.' });
  }
});

// Hide or restore listing
router.patch('/reports/:publicId/moderation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId } = req.params;
    const { action, reason } = req.body; // action: 'HIDE' | 'RESTORE'

    if (!['HIDE', 'RESTORE'].includes(action)) {
      res.status(400).json({ error: 'Action must be HIDE or RESTORE.' });
      return;
    }

    const report = await Report.findOne({ publicId });
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    const previousStatus = report.status;
    report.status = action === 'HIDE' ? 'UNDER_REVIEW' : 'ACTIVE';
    await report.save();

    // Audit log
    await AuditLog.create({
      actingUserId: req.user!.id,
      actionType: `REPORT_${action}`,
      entityType: 'Report',
      entityId: report._id.toString(),
      metadata: { publicId, previousStatus, newStatus: report.status, reason },
    });

    // Notify user
    await Notification.create({
      recipientId: report.reporterId,
      type: 'REPORT_MODERATED',
      title: action === 'HIDE' ? 'Listing Placed Under Review' : 'Listing Restored',
      message: `Your listing "${report.title}" was ${action === 'HIDE' ? 'temporarily restricted by a moderator for review' : 'restored to active status'}.${reason ? ` Reason: "${reason}"` : ''}`,
      relatedReportId: report._id,
    });

    res.json({ message: `Listing successfully updated to ${report.status}`, report });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to moderate report.' });
  }
});

// Suspend or activate user
router.patch('/users/:userId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body; // 'ACTIVE' | 'SUSPENDED'

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ error: 'Status must be ACTIVE or SUSPENDED.' });
      return;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (targetUser.role === 'MODERATOR') {
      res.status(403).json({ error: 'Cannot modify status of fellow moderator accounts.' });
      return;
    }

    targetUser.status = status;
    await targetUser.save();

    // If suspended, revoke all active sessions immediately
    if (status === 'SUSPENDED') {
      await revokeAllSessionsForUser(targetUser._id);
    }

    await AuditLog.create({
      actingUserId: req.user!.id,
      actionType: `USER_${status}`,
      entityType: 'User',
      entityId: targetUser._id.toString(),
      metadata: { userEmail: targetUser.email, reason },
    });

    res.json({ message: `User status updated to ${status}`, user: targetUser });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Analytics
router.get('/analytics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalReports,
      activeReports,
      resolvedReports,
      underReviewReports,
      totalClaims,
      totalUsers,
      recentAuditLogs,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'ACTIVE' }),
      Report.countDocuments({ status: 'RESOLVED' }),
      Report.countDocuments({ status: 'UNDER_REVIEW' }),
      Claim.countDocuments(),
      User.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).limit(15).populate('actingUserId', 'displayName email'),
    ]);

    res.json({
      analytics: {
        totalReports,
        activeReports,
        resolvedReports,
        underReviewReports,
        totalClaims,
        totalUsers,
      },
      recentAuditLogs,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

export const moderationRoutes = router;
