import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'STUDENT' | 'MODERATOR';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type HostelType = 'UNIWORLD_1' | 'UNIWORLD_2' | 'OTHER' | 'NONE';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  hostel?: HostelType;
  roomNumber?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    hostel: {
      type: String,
      enum: ['UNIWORLD_1', 'UNIWORLD_2', 'OTHER', 'NONE'],
      default: 'NONE',
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['STUDENT', 'MODERATOR'],
      default: 'STUDENT',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: any) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
