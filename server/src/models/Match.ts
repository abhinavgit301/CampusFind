import mongoose, { Schema, Document, Types } from 'mongoose';

export type MatchStatus = 'SUGGESTED' | 'DISMISSED' | 'RESOLVED';

export interface IMatchScoreBreakdown {
  category: number;
  description: number;
  location: number;
  time: number;
  attributes: number;
}

export interface IMatch extends Document {
  lostReportId: Types.ObjectId;
  foundReportId: Types.ObjectId;
  score: number;
  scoreBreakdown: IMatchScoreBreakdown;
  reasons: string[];
  algorithmVersion: string;
  status: MatchStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    lostReportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    foundReportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    scoreBreakdown: {
      category: { type: Number, default: 0 },
      description: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      time: { type: Number, default: 0 },
      attributes: { type: Number, default: 0 },
    },
    reasons: {
      type: [String],
      default: [],
    },
    algorithmVersion: {
      type: String,
      default: '1.0',
    },
    status: {
      type: String,
      enum: ['SUGGESTED', 'DISMISSED', 'RESOLVED'],
      default: 'SUGGESTED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MatchSchema.index({ lostReportId: 1, foundReportId: 1 }, { unique: true });

export const Match = mongoose.model<IMatch>('Match', MatchSchema);
