import mongoose, { Schema, Document, Types } from 'mongoose';

export type ClaimStatus = 'PENDING' | 'NEEDS_INFORMATION' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface IClaim extends Document {
  foundReportId: Types.ObjectId;
  claimantId: Types.ObjectId;
  answers: Record<string, string>;
  evidenceKeys: string[];
  status: ClaimStatus;
  reviewerId?: Types.ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    foundReportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    claimantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    evidenceKeys: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['PENDING', 'NEEDS_INFORMATION', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ClaimSchema.index({ foundReportId: 1, status: 1 });

export const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);
