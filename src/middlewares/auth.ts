import type { NextFunction, Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { verifyAccessToken } from "../utils/jwt";

function extractToken(req: Request) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieToken =
    typeof req.cookies?.accessToken === "string"
      ? req.cookies.accessToken
      : typeof req.cookies?.token === "string"
        ? req.cookies.token
        : "";

  return cookieToken.trim();
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const payload = verifyAccessToken(token);

    if (typeof payload.tokenVersion !== "number") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    const user = await UserModel.findById(payload.uid).select(
      "_id email role is_active token_version"
    );

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (payload.tokenVersion !== Number(user.token_version || 0)) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    req.user = {
      uid: String(user._id),
      email: user.email,
      role: user.role,
      tokenVersion: user.token_version,
    };

    next();
  } catch (error) {
    const message =
      error instanceof Error &&
      ["ACCESS_TOKEN_EXPIRED", "INVALID_ACCESS_TOKEN"].includes(error.message)
        ? "Unauthorized"
        : "Unauthorized";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}
