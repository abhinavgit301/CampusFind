import { Request, Response } from 'express';
import { Report, IReport, ReportStatus, HoldingLocation } from '../../models/Report.js';
import { RecoveryRecord } from '../../models/RecoveryRecord.js';
import { Notification } from '../../models/Notification.js';
import { findAndStoreMatchesForReport } from '../../services/matchService.js';
import { getPublicImageUrl } from '../../services/storageService.js';

export const CATEGORIES = [
  'Electronics',
  'ID Cards and Documents',
  'Keys',
  'Bags and Wallets',
  'Clothing',
  'Books and Stationery',
  'Accessories',
  'Bottles and Containers',
  'Other',
];

export const CAMPUS_LOCATIONS = [
  'Uniworld 1',
  'Uniworld 2',
  'Macro Campus',
  'Other',
];

function sanitizeReportForClient(report: IReport, viewerId?: string, viewerRole?: string): any {
  const isOwner = viewerId && report.reporterId.toString() === viewerId;
  const isModerator = viewerRole === 'MODERATOR';

  const doc = report.toObject ? report.toObject() : { ...report };

  // Resolve photo URLs
  if (doc.photoKeys && Array.isArray(doc.photoKeys)) {
    doc.photoUrls = doc.photoKeys.map((key: string) => getPublicImageUrl(key));
  } else {
    doc.photoUrls = [];
  }

  // Contact details privacy rules
  if (doc.reportType === 'LOST') {
    // A lost item post must not expose phone number or room number publicly
    if (!isOwner && !isModerator) {
      delete doc.contactDetails;
    }
  } else if (doc.reportType === 'FOUND') {
    if (
      ['MACRO_RECEPTION', 'UNIWORLD_1_RECEPTION', 'UNIWORLD_2_RECEPTION'].includes(
        doc.holdingLocation
      )
    ) {
      doc.contactDetails = null;
    } else if (doc.holdingLocation === 'WITH_FINDER') {
      // Allowed for public viewing if finder approved
    }
  }

  return doc;
}

export async function listReports(req: Request, res: Response): Promise<void> {
  try {
    const {
      type,
      category,
      location,
      holdingLocation,
      search,
      status = 'ACTIVE',
      page = '1',
      limit = '12',
    } = req.query;

    const query: any = {};

    // By default, public search only sees ACTIVE
    const isModerator = req.user?.role === 'MODERATOR';
    if (status && status !== 'ALL') {
      query.status = status;
    } else if (!isModerator) {
      query.status = 'ACTIVE';
    }

    if (type && (type === 'LOST' || type === 'FOUND')) {
      query.reportType = type;
    }

    if (category && category !== 'ALL') {
      query.categoryId = category;
    }

    if (holdingLocation && holdingLocation !== 'ALL') {
      query.holdingLocation = holdingLocation;
    }

    if (location && location !== 'ALL') {
      query.$or = [
        { lastSeenLocation: location },
        { foundLocation: location },
      ];
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('reporterId', 'displayName email'),
      Report.countDocuments(query),
    ]);

    const sanitized = reports.map(r =>
      sanitizeReportForClient(r, req.user?.id, req.user?.role)
    );

    res.json({
      reports: sanitized,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('[ReportController.listReports] error:', error);
    res.status(500).json({ error: 'Failed to retrieve listings.' });
  }
}

export async function getReportByPublicId(req: Request, res: Response): Promise<void> {
  try {
    const { publicId } = req.params;
    const report = await Report.findOne({ publicId }).populate('reporterId', 'displayName email');

    if (!report) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    // Check visibility for non-active listings
    const isOwner = req.user && report.reporterId._id.toString() === req.user.id;
    const isModerator = req.user?.role === 'MODERATOR';

    if (report.status !== 'ACTIVE' && report.status !== 'RESOLVED' && !isOwner && !isModerator) {
      res.status(404).json({ error: 'This listing is no longer publicly available.' });
      return;
    }

    res.json({
      report: sanitizeReportForClient(report, req.user?.id, req.user?.role),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch listing.' });
  }
}

export async function createReport(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      reportType,
      categoryId,
      title,
      description,
      attributes,
      photoKeys,
      eventAt,
      lastSeenLocation,
      foundLocation,
      holdingLocation,
      contactDetails,
      consentGiven,
    } = req.body;

    if (!reportType || !categoryId || !title || !description || !eventAt) {
      res.status(400).json({ error: 'Please provide all required fields.' });
      return;
    }

    if (reportType !== 'LOST' && reportType !== 'FOUND') {
      res.status(400).json({ error: 'Invalid report type.' });
      return;
    }

    let finalContactDetails: any = null;

    if (reportType === 'LOST') {
      if (!lastSeenLocation) {
        res.status(400).json({ error: 'Last-seen location is required for lost items.' });
        return;
      }
      // Lost reports never auto-publish phone or room number
      finalContactDetails = null;
    } else if (reportType === 'FOUND') {
      if (!foundLocation) {
        res.status(400).json({ error: 'Please specify where the item was found.' });
        return;
      }
      const validHoldingLocations = [
        'MACRO_RECEPTION',
        'UNIWORLD_1_RECEPTION',
        'UNIWORLD_2_RECEPTION',
        'WITH_FINDER',
      ];
      if (!holdingLocation || !validHoldingLocations.includes(holdingLocation)) {
        res.status(400).json({ error: 'Please specify where the found item is currently kept.' });
        return;
      }

      if (['MACRO_RECEPTION', 'UNIWORLD_1_RECEPTION', 'UNIWORLD_2_RECEPTION'].includes(holdingLocation)) {
        // Backend rejects or removes personal contact details
        finalContactDetails = null;
      } else if (holdingLocation === 'WITH_FINDER') {
        if (!contactDetails || !contactDetails.phoneNumber || contactDetails.phoneNumber.trim() === '') {
          res.status(400).json({
            error: 'A contact phone number is compulsory when keeping a found item personally.',
          });
          return;
        }

        if (!consentGiven) {
          res.status(400).json({
            error: 'You must explicitly consent to sharing your contact details for this listing.',
          });
          return;
        }

        finalContactDetails = {
          displayName: contactDetails.displayName || req.user.displayName,
          phoneNumber: contactDetails.phoneNumber.trim(),
          hostel: contactDetails.hostel || '',
          roomNumber: contactDetails.roomNumber || '',
        };
      }
    }

    // Generate unique short public ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().getFullYear();
    const publicId = `CF-${datePrefix}-${randomSuffix}`;

    const report = await Report.create({
      publicId,
      reportType,
      reporterId: req.user.id,
      categoryId,
      title: title.trim(),
      description: description.trim(),
      attributes: attributes || {},
      photoKeys: photoKeys || [],
      eventAt: new Date(eventAt),
      lastSeenLocation: reportType === 'LOST' ? lastSeenLocation : undefined,
      foundLocation: reportType === 'FOUND' ? foundLocation : undefined,
      holdingLocation: reportType === 'FOUND' ? holdingLocation : undefined,
      contactDetails: finalContactDetails,
      status: 'ACTIVE',
    });

    // Run deterministic matching in background
    findAndStoreMatchesForReport(report).catch(err => {
      console.error('[ReportController] Matching trigger error:', err);
    });

    res.status(201).json({
      message: 'Report created successfully',
      report: sanitizeReportForClient(report, req.user.id, req.user.role),
    });
  } catch (error: any) {
    console.error('[ReportController.createReport] error:', error);
    res.status(500).json({ error: 'Failed to create report.' });
  }
}

export async function updateReport(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { publicId } = req.params;
    const report = await Report.findOne({ publicId });

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const isOwner = report.reporterId.toString() === req.user.id;
    const isModerator = req.user.role === 'MODERATOR';

    if (!isOwner && !isModerator) {
      res.status(403).json({ error: 'You are not authorized to edit this listing.' });
      return;
    }

    if (report.status !== 'ACTIVE' && !isModerator) {
      res.status(400).json({ error: 'Only active listings can be modified.' });
      return;
    }

    const { title, description, categoryId, attributes, photoKeys } = req.body;

    if (title) report.title = title.trim();
    if (description) report.description = description.trim();
    if (categoryId) report.categoryId = categoryId;
    if (attributes) report.attributes = attributes;
    if (photoKeys) report.photoKeys = photoKeys;

    await report.save();

    res.json({
      message: 'Report updated successfully',
      report: sanitizeReportForClient(report, req.user.id, req.user.role),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
}

export async function withdrawReport(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { publicId } = req.params;
    const report = await Report.findOne({ publicId });

    if (!report) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const isOwner = report.reporterId.toString() === req.user.id;
    const isModerator = req.user.role === 'MODERATOR';

    if (!isOwner && !isModerator) {
      res.status(403).json({ error: 'Not authorized to withdraw this listing.' });
      return;
    }

    report.status = 'WITHDRAWN';
    await report.save();

    res.json({ message: 'Listing withdrawn successfully.', report });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to withdraw listing.' });
  }
}

export async function confirmRecovery(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { publicId } = req.params;
    const { claimId, claimantId, notes } = req.body;

    const report = await Report.findOne({ publicId });
    if (!report) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const isOwner = report.reporterId.toString() === req.user.id;
    const isModerator = req.user.role === 'MODERATOR';

    if (!isOwner && !isModerator) {
      res.status(403).json({ error: 'Not authorized to confirm recovery for this report.' });
      return;
    }

    if (report.status === 'RESOLVED') {
      res.status(409).json({ error: 'This listing is already marked as recovered.' });
      return;
    }

    report.status = 'RESOLVED';
    report.resolvedAt = new Date();
    await report.save();

    // Create recovery record
    const record = await RecoveryRecord.create({
      reportId: report._id,
      claimId: claimId || undefined,
      foundByUserId: report.reporterId,
      claimantId: claimantId || undefined,
      completedAt: new Date(),
      confirmedBy: req.user.id,
      notes: notes || 'Item confirmed returned and case resolved.',
    });

    // Notify involved parties
    if (claimantId && claimantId !== req.user.id) {
      await Notification.create({
        recipientId: claimantId,
        type: 'RECOVERY_CONFIRMED',
        title: 'Item Recovered!',
        message: `Recovery of "${report.title}" has been confirmed and marked as resolved.`,
        relatedReportId: report._id,
      });
    }

    res.json({
      message: 'Recovery confirmed and listing marked resolved!',
      report,
      recoveryRecord: record,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to confirm recovery.' });
  }
}

export async function getMyReports(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const reports = await Report.find({ reporterId: req.user.id }).sort({ createdAt: -1 });
    const sanitized = reports.map(r => sanitizeReportForClient(r, req.user?.id, req.user?.role));
    res.json({ reports: sanitized });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch personal listings.' });
  }
}
