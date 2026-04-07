import { Request, Response, NextFunction } from "express";

export function requireRole(...allowedRoles: Array<"ADMIN" | "EDITOR" | "USER">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!role) {
      return res.status(403).json({
        success: false,
        message: "Role not found",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };
}