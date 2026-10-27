import { Report, IReport } from '../models/Report.js';
import { Match, IMatchScoreBreakdown } from '../models/Match.js';
import { Notification } from '../models/Notification.js';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'it', 'my', 'i', 'was', 'were', 'lost', 'found', 'please', 'help', 'near',
  'around', 'campus', 'room', 'hostel', 'someone'
]);

export function tokenizeAndNormalize(text: string): Set<string> {
  if (!text) return new Set();
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
  return new Set(tokens);
}

export function calculateTextOverlap(tokens1: Set<string>, tokens2: Set<string>): number {
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  let intersection = 0;
  tokens1.forEach(token => {
    if (tokens2.has(token)) intersection++;
  });
  const union = new Set([...tokens1, ...tokens2]).size;
  return union > 0 ? (intersection / union) * 100 : 0;
}

export function calculateLocationScore(loc1?: string, loc2?: string): number {
  if (!loc1 || !loc2) return 0;
  const l1 = loc1.trim().toLowerCase();
  const l2 = loc2.trim().toLowerCase();
  if (l1 === l2) return 100;
  if (l1.includes(l2) || l2.includes(l1)) return 80;
  const t1 = tokenizeAndNormalize(l1);
  const t2 = tokenizeAndNormalize(l2);
  return calculateTextOverlap(t1, t2);
}

export function calculateTimeProximityScore(d1: Date, d2: Date): number {
  const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return 100;
  if (diffDays <= 3) return 85;
  if (diffDays <= 7) return 60;
  if (diffDays <= 14) return 40;
  if (diffDays <= 30) return 20;
  return 5;
}

export function calculateAttributeScore(
  attr1: Record<string, string> | Map<string, string> = {},
  attr2: Record<string, string> | Map<string, string> = {}
): { score: number; hasSignals: boolean } {
  const map1 = attr1 instanceof Map ? Object.fromEntries(attr1) : attr1;
  const map2 = attr2 instanceof Map ? Object.fromEntries(attr2) : attr2;

  const keys1 = Object.keys(map1 || {});
  const keys2 = Object.keys(map2 || {});

  if (keys1.length === 0 && keys2.length === 0) {
    return { score: 0, hasSignals: false };
  }

  let matches = 0;
  let totalKeys = 0;

  const allKeys = new Set([...keys1, ...keys2]);
  allKeys.forEach(key => {
    totalKeys++;
    const v1 = (map1[key] || '').toLowerCase().trim();
    const v2 = (map2[key] || '').toLowerCase().trim();
    if (v1 && v2 && v1 === v2) {
      matches++;
    }
  });

  return {
    score: totalKeys > 0 ? (matches / totalKeys) * 100 : 0,
    hasSignals: totalKeys > 0,
  };
}

export function calculateDeterministicScore(lost: IReport, found: IReport): {
  finalScore: number;
  breakdown: IMatchScoreBreakdown;
  reasons: string[];
} {
  const reasons: string[] = [];

  // 1. Category (Weight: 0.20)
  const categoryScore = lost.categoryId === found.categoryId ? 100 : 0;
  if (categoryScore === 100) {
    reasons.push(`Matching category: ${lost.categoryId}`);
  }

  // 2. Description & Title Similarity (Weight: 0.30)
  const lostTokens = tokenizeAndNormalize(`${lost.title} ${lost.description}`);
  const foundTokens = tokenizeAndNormalize(`${found.title} ${found.description}`);
  const descriptionScore = calculateTextOverlap(lostTokens, foundTokens);
  if (descriptionScore >= 40) {
    reasons.push(`High textual similarity in title and description`);
  }

  // 3. Location Similarity (Weight: 0.20)
  const lostLocation = lost.lastSeenLocation || '';
  const foundLocation = found.foundLocation || '';
  const locationScore = calculateLocationScore(lostLocation, foundLocation);
  if (locationScore >= 70) {
    reasons.push(`Similar location (${lostLocation} ≈ ${foundLocation})`);
  }

  // 4. Time Proximity (Weight: 0.15)
  const timeScore = calculateTimeProximityScore(new Date(lost.eventAt), new Date(found.eventAt));
  if (timeScore >= 60) {
    reasons.push(`Close event timeline within same period`);
  }

  // 5. Attributes (Weight: 0.15)
  const attrResult = calculateAttributeScore(lost.attributes, found.attributes);
  if (attrResult.score >= 50) {
    reasons.push(`Matching item attributes`);
  }

  // Weighted normalization
  let totalWeight = 0;
  let weightedSum = 0;

  // Category
  weightedSum += 0.20 * categoryScore;
  totalWeight += 0.20;

  // Description
  weightedSum += 0.30 * descriptionScore;
  totalWeight += 0.30;

  // Location
  if (lostLocation || foundLocation) {
    weightedSum += 0.20 * locationScore;
    totalWeight += 0.20;
  }

  // Time
  weightedSum += 0.15 * timeScore;
  totalWeight += 0.15;

  // Attributes
  if (attrResult.hasSignals) {
    weightedSum += 0.15 * attrResult.score;
    totalWeight += 0.15;
  }

  const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  const breakdown: IMatchScoreBreakdown = {
    category: categoryScore,
    description: Math.round(descriptionScore),
    location: Math.round(locationScore),
    time: Math.round(timeScore),
    attributes: Math.round(attrResult.score),
  };

  return { finalScore, breakdown, reasons };
}

export async function findAndStoreMatchesForReport(report: IReport): Promise<void> {
  try {
    const isLost = report.reportType === 'LOST';
    const oppositeType = isLost ? 'FOUND' : 'LOST';

    // Query active candidates
    const candidates = await Report.find({
      reportType: oppositeType,
      status: 'ACTIVE',
      _id: { $ne: report._id },
    }).limit(50);

    for (const candidate of candidates) {
      const lostReport = isLost ? report : candidate;
      const foundReport = isLost ? candidate : report;

      const { finalScore, breakdown, reasons } = calculateDeterministicScore(lostReport, foundReport);

      if (finalScore >= 50) {
        // Upsert match record
        const match = await Match.findOneAndUpdate(
          { lostReportId: lostReport._id, foundReportId: foundReport._id },
          {
            score: finalScore,
            scoreBreakdown: breakdown,
            reasons,
            algorithmVersion: '1.0',
            status: 'SUGGESTED',
          },
          { upsert: true, new: true }
        );

        // Notify both parties if high score (>= 70)
        if (finalScore >= 70 && match) {
          // Notify lost item owner
          await Notification.create({
            recipientId: lostReport.reporterId,
            type: 'MATCH_SUGGESTED',
            title: 'Potential Match Found',
            message: `A found item "${foundReport.title}" scored ${finalScore}% match with your lost "${lostReport.title}".`,
            relatedReportId: foundReport._id,
          });

          // Notify found item poster
          await Notification.create({
            recipientId: foundReport.reporterId,
            type: 'MATCH_SUGGESTED',
            title: 'Potential Match Found',
            message: `A lost item report "${lostReport.title}" scored ${finalScore}% match with your listing.`,
            relatedReportId: lostReport._id,
          });
        }
      }
    }
  } catch (error) {
    console.error('[MatchService] Error calculating matches:', error);
  }
}
