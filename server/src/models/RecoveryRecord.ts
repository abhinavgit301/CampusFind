import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecoveryRecord extends Document {
  reportId: Types.ObjectId;
  claimId?: Types.ObjectId;
  foundByUserId: Types.ObjectId;
  claimantId?: Types.ObjectId;
  completedAt: Date;
  confirmedBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryRecordSchema = new Schema<IRecoveryRecord>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
    },
    foundByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    claimantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const RecoveryRecord = mongoose.model<IRecoveryRecord>('RecoveryRecord', RecoveryRecordSchema);
