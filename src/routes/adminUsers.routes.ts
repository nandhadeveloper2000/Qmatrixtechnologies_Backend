// src/routes/admin.routes.ts
import { Router } from "express";
import {
  adminListUsers,
  adminListAdmins,
  adminSetActive,
  adminForceLogout,
  adminSetRole,
} from "../controllers/adminUsers.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const r = Router();

r.get("/users", requireAuth, requireAdmin, adminListUsers);
r.get("/admins", requireAuth, requireAdmin, adminListAdmins);
r.patch("/users/:id/active", requireAuth, requireAdmin, adminSetActive);
r.post("/users/:id/force-logout", requireAuth, requireAdmin, adminForceLogout);
r.patch("/users/:id/role", requireAuth, requireAdmin, adminSetRole);

export default r;