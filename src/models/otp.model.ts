import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
  attemptCount: number;
  lastAttemptAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", otpSchema);
