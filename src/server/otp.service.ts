// src/services/otp.service.ts
import { OtpModel } from "../models/otp.model";
import { generateOtp } from "../utils/generateOtp";
import { hashValue, compareValue } from "../utils/hash";

const OTP_EXPIRY_MINUTES = 5;

export async function createOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const otp = generateOtp(6);
  const otpHash = await hashValue(otp);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Remove previous OTPs
  await OtpModel.deleteMany({ email: normalizedEmail });

  const otpDoc = await OtpModel.create({
    email: normalizedEmail,
    otpHash,
    expiresAt,
  });

  return {
    otp, // send via email
    otpDoc,
    expiresAt,
  };
}

export async function verifyOtp(email: string, otp: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const otpDoc = await OtpModel.findOne({ email: normalizedEmail }).sort({
    createdAt: -1,
  });

  if (!otpDoc) {
    return { ok: false, message: "OTP not found" };
  }

  if (otpDoc.expiresAt.getTime() < Date.now()) {
    await OtpModel.deleteOne({ _id: otpDoc._id });
    return { ok: false, message: "OTP expired" };
  }

  const isMatch = await compareValue(otp.trim(), otpDoc.otpHash);

  if (!isMatch) {
    return { ok: false, message: "Invalid OTP" };
  }

  await OtpModel.deleteOne({ _id: otpDoc._id });

  return { ok: true, message: "OTP verified" };
}