import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_STATUS_UPDATE'
  | 'MATCH_SUGGESTED'
  | 'REPORT_MODERATED'
  | 'RECOVERY_CONFIRMED'
  | 'GENERAL';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedReportId?: Types.ObjectId;
  relatedClaimId?: Types.ObjectId;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'CLAIM_SUBMITTED',
        'CLAIM_STATUS_UPDATE',
        'MATCH_SUGGESTED',
        'REPORT_MODERATED',
        'RECOVERY_CONFIRMED',
        'GENERAL',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedReportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
    },
    relatedClaimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
