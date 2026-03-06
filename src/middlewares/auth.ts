import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type AccessPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = String(req.headers.authorization || "");
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token) return res.status(401).json({ success: false, message: "Missing token" });

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid/expired token" });
  }
}