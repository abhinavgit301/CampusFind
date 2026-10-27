import { Request, Response } from 'express';
import { Claim, ClaimStatus } from '../../models/Claim.js';
import { Report } from '../../models/Report.js';
import { Notification } from '../../models/Notification.js';
import { AuditLog } from '../../models/AuditLog.js';

export async function submitClaim(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { publicId } = req.params;
    const { answers, evidenceKeys } = req.body;

    const report = await Report.findOne({ publicId });
    if (!report) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    if (report.reportType !== 'FOUND') {
      res.status(400).json({ error: 'Claims can only be filed on found item listings.' });
      return;
    }

    if (report.status !== 'ACTIVE') {
      res.status(400).json({ error: 'This listing is no longer active for new claims.' });
      return;
    }

    if (report.reporterId.toString() === req.user.id) {
      res.status(400).json({ error: 'You cannot file an ownership claim on an item you reported.' });
      return;
    }

    // Check if user already submitted pending claim
    const existingClaim = await Claim.findOne({
      foundReportId: report._id,
      claimantId: req.user.id,
      status: { $in: ['PENDING', 'NEEDS_INFORMATION', 'APPROVED'] },
    });

    if (existingClaim) {
      res.status(409).json({ error: 'You already have an active claim on this listing.' });
      return;
    }

    const claim = await Claim.create({
      foundReportId: report._id,
      claimantId: req.user.id,
      answers: answers || {},
      evidenceKeys: evidenceKeys || [],
      status: 'PENDING',
    });

    // Notify the finder
    await Notification.create({
      recipientId: report.reporterId,
      type: 'CLAIM_SUBMITTED',
      title: 'New Ownership Claim Submitted',
      message: `${req.user.displayName} has submitted an ownership claim on "${report.title}".`,
      relatedReportId: report._id,
      relatedClaimId: claim._id,
    });

    res.status(201).json({
      message: 'Claim submitted successfully. The finder has been notified.',
      claim,
    });
  } catch (error: any) {
    console.error('[ClaimController.submitClaim] error:', error);
    res.status(500).json({ error: 'Failed to submit claim.' });
  }
}

export async function getClaimsForReport(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { publicId } = req.params;
    const report = await Report.findOne({ publicId });
    if (!report) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    const isOwner = report.reporterId.toString() === req.user.id;
    const isModerator = req.user.role === 'MODERATOR';

    if (!isOwner && !isModerator) {
      res.status(403).json({ error: 'You are not authorized to view claims on this listing.' });
      return;
    }

    const claims = await Claim.find({ foundReportId: report._id })
      .sort({ createdAt: -1 })
      .populate('claimantId', 'displayName email phoneNumber hostel roomNumber');

    res.json({ claims });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch claims.' });
  }
}

export async function getMyClaims(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const claims = await Claim.find({ claimantId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('foundReportId', 'publicId title categoryId foundLocation holdingLocation status photoKeys');

    res.json({ claims });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch personal claims.' });
  }
}

export async function reviewClaim(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!['APPROVED', 'REJECTED', 'NEEDS_INFORMATION'].includes(status)) {
      res.status(400).json({ error: 'Invalid claim status review value.' });
      return;
    }

    const claim = await Claim.findById(id).populate('foundReportId');
    if (!claim) {
      res.status(404).json({ error: 'Claim not found.' });
      return;
    }

    const report = claim.foundReportId as any;
    const isOwner = report.reporterId.toString() === req.user.id;
    const isModerator = req.user.role === 'MODERATOR';

    if (!isOwner && !isModerator) {
      res.status(403).json({ error: 'Not authorized to review this claim.' });
      return;
    }

    claim.status = status as ClaimStatus;
    claim.reviewerId = req.user.id as any;
    claim.reviewNote = reviewNote || '';
    claim.reviewedAt = new Date();
    await claim.save();

    // Notify the claimant
    await Notification.create({
      recipientId: claim.claimantId,
      type: 'CLAIM_STATUS_UPDATE',
      title: `Claim ${status}`,
      message: `Your claim on "${report.title}" was marked as ${status}.${reviewNote ? ` Note: "${reviewNote}"` : ''}`,
      relatedReportId: report._id,
      relatedClaimId: claim._id,
    });

    // Audit log
    await AuditLog.create({
      actingUserId: req.user.id,
      actionType: `CLAIM_${status}`,
      entityType: 'Claim',
      entityId: claim._id.toString(),
      metadata: { reportPublicId: report.publicId, reviewNote },
    });

    res.json({ message: `Claim updated to ${status}`, claim });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to review claim.' });
  }
}
