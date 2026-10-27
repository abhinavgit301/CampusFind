import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReportType = 'LOST' | 'FOUND';
export type HoldingLocation =
  | 'MACRO_RECEPTION'
  | 'UNIWORLD_1_RECEPTION'
  | 'UNIWORLD_2_RECEPTION'
  | 'WITH_FINDER';
export type ReportStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'RESOLVED' | 'WITHDRAWN' | 'EXPIRED';

export interface IListingContactDetails {
  displayName: string;
  phoneNumber: string;
  hostel?: string;
  roomNumber?: string;
}

export interface IReport extends Document {
  publicId: string;
  reportType: ReportType;
  reporterId: Types.ObjectId;
  categoryId: string;
  title: string;
  description: string;
  attributes: Record<string, string>;
  photoKeys: string[];
  eventAt: Date;
  lastSeenLocation?: string;
  foundLocation?: string;
  holdingLocation?: HoldingLocation;
  contactDetails?: IListingContactDetails | null;
  status: ReportStatus;
  resolvedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ['LOST', 'FOUND'],
      required: true,
      index: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    photoKeys: {
      type: [String],
      default: [],
    },
    eventAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastSeenLocation: {
      type: String,
      trim: true,
    },
    foundLocation: {
      type: String,
      trim: true,
    },
    holdingLocation: {
      type: String,
      enum: [
        'MACRO_RECEPTION',
        'UNIWORLD_1_RECEPTION',
        'UNIWORLD_2_RECEPTION',
        'WITH_FINDER',
      ],
    },
    contactDetails: {
      type: {
        displayName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        hostel: { type: String, default: '' },
        roomNumber: { type: String, default: '' },
      },
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'UNDER_REVIEW', 'RESOLVED', 'WITHDRAWN', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes specified in Blueprint section 10
ReportSchema.index({ status: 1, reportType: 1, createdAt: -1 });
ReportSchema.index({ categoryId: 1, status: 1 });
ReportSchema.index({ holdingLocation: 1, status: 1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
