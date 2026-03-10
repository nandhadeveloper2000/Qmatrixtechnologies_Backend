import { Request, Response } from "express";
import { isMasterAdminEmail, isMasterAdminUser } from "../utils/admin";
import { UserModel } from "../models/user.model";

type UserRole = "USER" | "ADMIN";

function toInt(v: unknown, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function buildSearchFilter(q: string, onlyAdmins = false) {
  const query = q.trim();

  const filter: Record<string, any> = {};

  if (onlyAdmins) {
    filter.role = "ADMIN";
  }

  if (query) {
    filter.$or = [
      { email: { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } },
    ];
  }

  return filter;
}

/**
 * GET /api/admin/users?q=&page=1&limit=20
 * Lists all users
 */
export async function adminListUsers(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = toInt(req.query.page, 1);
    const limit = Math.min(toInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;

    const filter = buildSearchFilter(q, false);

    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .select("-password -refresh_token_hash -otp -otpExpiry")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        page,
        limit,
        total,
        items,
      },
    });
  } catch (err: any) {
    console.error("adminListUsers error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
}

/**
 * GET /api/admin/admins?q=&page=1&limit=20
 * Lists only admins
 */
export async function adminListAdmins(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = toInt(req.query.page, 1);
    const limit = Math.min(toInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;

    const filter = buildSearchFilter(q, true);

    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .select("-password -refresh_token_hash -otp -otpExpiry")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        page,
        limit,
        total,
        items,
      },
    });
  } catch (err: any) {
    console.error("adminListAdmins error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
}

/**
 * PATCH /api/admin/users/:id/active
 * Body: { isActive: boolean }
 */
export async function adminSetActive(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    const isActive = req.body?.isActive === true;

    const target = await UserModel.findById(id).lean();

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const targetRole = String(target.role || "").toUpperCase();
    const targetEmail = String(target.email || "");
    const currentlyActive = target.is_active === true;

    if (!isActive && targetRole === "ADMIN" && isMasterAdminEmail(targetEmail)) {
      return res.status(403).json({
        success: false,
        message: "Cannot deactivate master admin",
      });
    }

    if (!isActive && targetRole === "ADMIN" && currentlyActive) {
      const activeAdmins = await UserModel.countDocuments({
        role: "ADMIN",
        is_active: true,
      });

      if (activeAdmins <= 1) {
        return res.status(409).json({
          success: false,
          message: "Cannot deactivate the last active admin",
        });
      }
    }

    await UserModel.findByIdAndUpdate(id, {
      $set: {
        is_active: isActive,
      },
    });

    return res.json({
      success: true,
      message: isActive ? "Activated" : "Deactivated",
    });
  } catch (err: any) {
    console.error("adminSetActive error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
}

/**
 * POST /api/admin/users/:id/force-logout
 */
export async function adminForceLogout(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();

    const target = await UserModel.findById(id).lean();

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const targetRole = String(target.role || "").toUpperCase();
    const targetEmail = String(target.email || "");

    if (targetRole === "ADMIN" && isMasterAdminEmail(targetEmail)) {
      return res.status(403).json({
        success: false,
        message: "Cannot force logout master admin",
      });
    }

    await UserModel.findByIdAndUpdate(id, {
      $inc: { token_version: 1 },
      $set: {
        refresh_token_hash: null,
      },
    });

    return res.json({
      success: true,
      message: "Forced logout applied",
    });
  } catch (err: any) {
    console.error("adminForceLogout error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role: "USER" | "ADMIN" }
 */
export async function adminSetRole(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    const newRole = String(req.body?.role || "").trim().toUpperCase() as UserRole;

    if (newRole !== "USER" && newRole !== "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "Role must be USER or ADMIN",
      });
    }

    if (!isMasterAdminUser((req as any).user)) {
      return res.status(403).json({
        success: false,
        message: "Only master admin can change roles",
      });
    }

    const target = await UserModel.findById(id).lean();

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentRole = String(target.role || "").toUpperCase() as UserRole;
    const targetEmail = String(target.email || "");
    const currentlyActive = target.is_active === true;

    if (
      currentRole === "ADMIN" &&
      newRole === "USER" &&
      isMasterAdminEmail(targetEmail)
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot downgrade master admin",
      });
    }

    if (currentRole === "ADMIN" && newRole === "USER" && currentlyActive) {
      const activeAdmins = await UserModel.countDocuments({
        role: "ADMIN",
        is_active: true,
      });

      if (activeAdmins <= 1) {
        return res.status(409).json({
          success: false,
          message: "Cannot downgrade the last active admin",
        });
      }
    }

    await UserModel.findByIdAndUpdate(id, {
      $set: {
        role: newRole,
        refresh_token_hash: null,
      },
      $inc: {
        token_version: 1,
      },
    });

    return res.json({
      success: true,
      message: `Role updated to ${newRole} and user logged out`,
    });
  } catch (err: any) {
    console.error("adminSetRole error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
}