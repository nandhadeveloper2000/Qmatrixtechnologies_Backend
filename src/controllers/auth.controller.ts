import type { Request, Response } from "express";
import { env } from "../config/env";
import { UserModel, type UserDoc } from "../models/user.model";
import { normEmail } from "../utils/normalize";
import { compareValue, hashValue } from "../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessPayload,
} from "../utils/jwt";

function refreshToHash(refreshToken: string) {
  return `${refreshToken}:${env.REFRESH_PEPPER}`;
}

function serializeUser(user: UserDoc) {
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
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null,
  };
}

export async function login(req: Request, res: Response) {
  try {
    const email = normEmail(req.body?.email);
    const password = String(req.body?.password ?? "").trim();

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    let user = await UserModel.findOne({ email }).select(
      "+password_hash +refresh_token_hash"
    );

    if (!user && env.MASTER_GOOGLE_EMAILS.includes(email)) {
      const password_hash = await hashValue(password);
      user = await UserModel.create({
        email,
        name: "Master Admin",
        role: "ADMIN",
        is_active: true,
        password_hash,
      });
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (env.MASTER_GOOGLE_EMAILS.includes(email)) {
      if (user.role !== "ADMIN" || !user.is_active) {
        user.role = "ADMIN";
        user.is_active = true;
      }
    }

    if (!user.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "User inactive" });
    }

    if (!user.password_hash) {
      if (env.MASTER_GOOGLE_EMAILS.includes(email)) {
        user.password_hash = await hashValue(password);
      } else {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
    } else {
      const ok = await compareValue(password, user.password_hash);

      if (!ok) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
    }

    const nextTokenVersion = Number(user.token_version || 0) + 1;
    user.token_version = nextTokenVersion;

    const payload: AccessPayload = {
      uid: String(user._id),
      email: user.email,
      role: user.role,
      tokenVersion: nextTokenVersion,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refresh_token_hash = await hashValue(refreshToHash(refreshToken));
    await user.save();

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: serializeUser(user),
    });
  } catch {
    return res.status(500).json({ success: false, message: "Login failed" });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = String(req.body?.refreshToken ?? "");

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing refresh token" });
    }

    let payload: AccessPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    if (typeof payload.tokenVersion !== "number") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const user = await UserModel.findById(payload.uid).select(
      "+refresh_token_hash"
    );

    if (!user || !user.is_active) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    if (payload.tokenVersion !== Number(user.token_version || 0)) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    if (!user.refresh_token_hash) {
      return res.status(401).json({ success: false, message: "Logged out" });
    }

    const ok = await compareValue(
      refreshToHash(refreshToken),
      user.refresh_token_hash
    );

    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const newPayload: AccessPayload = {
      uid: String(user._id),
      email: user.email,
      role: user.role,
      tokenVersion: Number(user.token_version || 0),
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
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to refresh token" });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    await UserModel.updateOne(
      { _id: userId },
      { $set: { refresh_token_hash: null }, $inc: { token_version: 1 } }
    );

    return res.json({ success: true, message: "Logged out" });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to logout" });
  }
}
