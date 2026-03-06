import { Request, Response, NextFunction } from "express";

export function requireRole(...allowedRoles: Array<"ADMIN" | "EDITOR" | "USER">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };
}