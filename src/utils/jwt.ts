import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../models/user.model";

/**
 * Access Token Payload
 */
export type AccessPayload = {
  uid: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
};

/**
 * Token Options
 */
const accessOpts: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
};

const refreshOpts: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
};

/**
 * Sign Access Token
 */
export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOpts);
}

/**
 * Sign Refresh Token
 */
export function signRefreshToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOpts);
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token: string): AccessPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw new Error("ACCESS_TOKEN_EXPIRED");
    }
    if (err.name === "JsonWebTokenError") {
      throw new Error("INVALID_ACCESS_TOKEN");
    }
    throw err;
  }
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token: string): AccessPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }
    if (err.name === "JsonWebTokenError") {
      throw new Error("INVALID_REFRESH_TOKEN");
    }
    throw err;
  }
}