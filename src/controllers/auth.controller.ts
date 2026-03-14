import { Request, Response } from "express";
import { env } from "../config/env";
import { sendOtpEmail } from "../config/mailer";
import { UserModel } from "../models/user.model";
import { OtpModel } from "../models/otp.model";
import { normEmail } from "../utils/normalize";
import { compareValue, hashValue } from "../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessPayload,
} from "../utils/jwt";

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpToHash(email: string, otp: string) {
  return `${email}:${otp}:${env.OTP_PEPPER}`;
}

function refreshToHash(refreshToken: string) {
  return `${refreshToken}:${env.REFRESH_PEPPER}`;
}

function serializeUser(user: any) {
  return {
    uid: String(user._id),
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    created_by: user.created_by ?? null,
    avatar_url: user.avatar_url ?? null,
    avatar_public_id: user.avatar_public_id ?? null,
    token_version: user.token_version,
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null,
  };
}

export async function requestOtp(req: Request, res: Response) {
  try {
    if (!env.ENABLE_LOGIN_OTP) {
      return res.status(400).json({ success: false, message: "OTP disabled" });
    }

    const email = normEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    let user = await UserModel.findOne({ email });

    if (!user && env.MASTER_GOOGLE_EMAILS.includes(email)) {
      user = await UserModel.create({
        email,
        name: "Master Admin",
        role: "ADMIN",
        is_active: true,
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "User inactive" });
    }

    if (user.role === "USER") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const otp = genOtp();
    const otpHash = await hashValue(otpToHash(email, otp));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpModel.deleteMany({ email });

    await OtpModel.create({
      email,
      otpHash,
      expiresAt,
    });

    await sendOtpEmail(email, otp);

    return res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("requestOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP email",
    });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  try {
    const email = normEmail(req.body?.email);
    const otp = String(req.body?.otp ?? "").trim();

    if (!email || otp.length !== 6) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "User inactive" });
    }

    if (user.role === "USER") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const doc = await OtpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!doc) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (doc.expiresAt.getTime() < Date.now()) {
      await OtpModel.deleteMany({ email });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const ok = await compareValue(otpToHash(email, otp), doc.otpHash);

    if (!ok) {
      return res.status(401).json({ success: false, message: "Wrong OTP" });
    }

    await OtpModel.deleteMany({ email });

    const payload: AccessPayload = {
      uid: String(user._id),
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refresh_token_hash = await hashValue(refreshToHash(refreshToken));
    user.token_version = Number(user.token_version || 0);
    await user.save();

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = String(req.body?.refreshToken ?? "");

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Missing refresh token",
      });
    }

    let payload: AccessPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const user = await UserModel.findById(payload.uid);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!user.refresh_token_hash) {
      return res.status(401).json({ success: false, message: "Logged out" });
    }

    const ok = await compareValue(
      refreshToHash(refreshToken),
      user.refresh_token_hash
    );

    if (!ok) {
      return res.status(401).json({ success: false, message: "Token mismatch" });
    }

    const newPayload: AccessPayload = {
      uid: String(user._id),
      email: user.email,
      role: user.role,
    };

    const newAccess = signAccessToken(newPayload);
    const newRefresh = signRefreshToken(newPayload);

    user.refresh_token_hash = await hashValue(refreshToHash(newRefresh));
    await user.save();

    return res.json({
      success: true,
      accessToken: newAccess,
      refreshToken: newRefresh,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("refresh error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const email = normEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    await UserModel.updateOne(
      { email },
      { $set: { refresh_token_hash: null }, $inc: { token_version: 1 } }
    );

    return res.json({ success: true, message: "Logged out" });
  } catch (error) {
    console.error("logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
}