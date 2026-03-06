import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../models/User";

export type AccessPayload = {
  uid: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
};

const accessOpts: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
};

const refreshOpts: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
};

export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOpts);
}

export function signRefreshToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOpts);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessPayload;
}