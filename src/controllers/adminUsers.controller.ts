// src/controllers/admin/users.controller.ts
import { Request, Response } from "express";
import { db } from "../config/db";
import { isMasterAdminEmail, isMasterAdminUser } from "../utils/admin";
import { mapUserRow, type UserRow, type UserRole } from "../models/user.model";

function toInt(v: any, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function likeQ(v: any) {
  const s = String(v ?? "").trim();
  return s ? `%${s}%` : "%";
}

/**
 * GET /api/admin/users?q=&page=1&limit=20
 * Lists ALL users (USER + ADMIN)
 */
export async function adminListUsers(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = toInt(req.query.page, 1);
    const limit = Math.min(toInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    const like = likeQ(q);

    const [countRows] = await db.query<any[]>(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE (email LIKE ? OR name LIKE ?)`,
      [like, like]
    );
    const total = Number(countRows?.[0]?.total ?? 0);

    const [rows] = await db.query<UserRow[]>(
      `SELECT id, email, name, role, is_active, token_version, created_at, updated_at
       FROM users
       WHERE (email LIKE ? OR name LIKE ?)
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [like, like, limit, offset]
    );

    return res.json({
      success: true,
      data: { page, limit, total, items: rows.map(mapUserRow) },
    });
  } catch (err: any) {
    console.error("adminListUsers error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
}

/**
 * GET /api/admin/admins?q=&page=1&limit=20
 * Lists ONLY admins
 */
export async function adminListAdmins(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = toInt(req.query.page, 1);
    const limit = Math.min(toInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    const like = likeQ(q);

    const [countRows] = await db.query<any[]>(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE role='ADMIN' AND (email LIKE ? OR name LIKE ?)`,
      [like, like]
    );
    const total = Number(countRows?.[0]?.total ?? 0);

    const [rows] = await db.query<UserRow[]>(
      `SELECT id, email, name, role, is_active, token_version, created_at, updated_at
       FROM users
       WHERE role='ADMIN' AND (email LIKE ? OR name LIKE ?)
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [like, like, limit, offset]
    );

    return res.json({
      success: true,
      data: { page, limit, total, items: rows.map(mapUserRow) },
    });
  } catch (err: any) {
    console.error("adminListAdmins error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
}

/**
 * PATCH /api/admin/users/:id/active
 * Body: { isActive: boolean }
 * Deactivate/activate USER or ADMIN (with "last active admin" guard)
 */
export async function adminSetActive(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    const isActive = !!req.body?.isActive;

    const [rows] = await db.query<any[]>(
      `SELECT id, email, role, is_active FROM users WHERE id=? LIMIT 1`,
      [id]
    );
    const target = rows?.[0];
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    // Prevent disabling a master admin (strong protection)
    if (!isActive && target.role === "ADMIN" && isMasterAdminEmail(target.email)) {
      return res.status(403).json({ success: false, message: "Cannot deactivate master admin" });
    }

    // Prevent disabling the last active admin
    if (!isActive && target.role === "ADMIN" && Number(target.is_active) === 1) {
      const [crows] = await db.query<any[]>(
        `SELECT COUNT(*) AS cnt FROM users WHERE role='ADMIN' AND is_active=1`,
        []
      );
      const activeAdmins = Number(crows?.[0]?.cnt ?? 0);
      if (activeAdmins <= 1) {
        return res
          .status(409)
          .json({ success: false, message: "Cannot deactivate the last active admin" });
      }
    }

    await db.query(`UPDATE users SET is_active=? WHERE id=?`, [isActive ? 1 : 0, id]);

    return res.json({ success: true, message: isActive ? "Activated" : "Deactivated" });
  } catch (err: any) {
    console.error("adminSetActive error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
}

/**
 * POST /api/admin/users/:id/force-logout
 * Force logout: increments token_version + clears refresh hash
 */
export async function adminForceLogout(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();

    const [rows] = await db.query<any[]>(
      `SELECT id, email, role FROM users WHERE id=? LIMIT 1`,
      [id]
    );
    const target = rows?.[0];
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    // Optional: protect master admins from forced logout
    if (target.role === "ADMIN" && isMasterAdminEmail(target.email)) {
      return res.status(403).json({ success: false, message: "Cannot force logout master admin" });
    }

    await db.query(
      `UPDATE users
       SET token_version = token_version + 1,
           refresh_token_hash = NULL
       WHERE id=?`,
      [id]
    );

    return res.json({ success: true, message: "Forced logout applied" });
  } catch (err: any) {
    console.error("adminForceLogout error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
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
      return res.status(400).json({ success: false, message: "Role must be USER or ADMIN" });
    }

    // Strict: only master admins can change roles
    if (!isMasterAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: "Only master admin can change roles" });
    }

    const [rows] = await db.query<any[]>(
      `SELECT id, email, role, is_active FROM users WHERE id=? LIMIT 1`,
      [id]
    );
    const target = rows?.[0];
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    const currentRole = String(target.role).toUpperCase() as UserRole;

    // Prevent downgrading master admin emails
    if (currentRole === "ADMIN" && newRole === "USER" && isMasterAdminEmail(target.email)) {
      return res.status(403).json({ success: false, message: "Cannot downgrade master admin" });
    }

    // Prevent downgrading the last active admin
    if (currentRole === "ADMIN" && newRole === "USER" && Number(target.is_active) === 1) {
      const [crows] = await db.query<any[]>(
        `SELECT COUNT(*) AS cnt FROM users WHERE role='ADMIN' AND is_active=1`,
        []
      );
      const activeAdmins = Number(crows?.[0]?.cnt ?? 0);
      if (activeAdmins <= 1) {
        return res
          .status(409)
          .json({ success: false, message: "Cannot downgrade the last active admin" });
      }
    }

    await db.query(`UPDATE users SET role=? WHERE id=?`, [newRole, id]);

    // Force logout after role change (permissions update immediately)
    await db.query(
      `UPDATE users
       SET token_version = token_version + 1,
           refresh_token_hash = NULL
       WHERE id=?`,
      [id]
    );

    return res.json({ success: true, message: `Role updated to ${newRole} and user logged out` });
  } catch (err: any) {
    console.error("adminSetRole error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
}