// src/models/Otp.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
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
  },
  {
    timestamps: true,
  }
);

// TTL index (auto delete expired OTP)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel: Model<IOtp> = mongoose.model<IOtp>("Otp", otpSchema);