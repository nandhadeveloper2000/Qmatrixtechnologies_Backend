import { Router } from "express";
import {
  adminListUsers,
  adminListAdmins,
  adminSetActive,
  adminForceLogout,
  adminSetRole,
} from "../controllers/adminUsers.controller";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";

const r = Router();

r.get("/users", requireAuth, requireRole("ADMIN"), adminListUsers);
r.get("/admins", requireAuth, requireRole("ADMIN"), adminListAdmins);
r.patch("/users/:id/active", requireAuth, requireRole("ADMIN"), adminSetActive);
r.post(
  "/users/:id/force-logout",
  requireAuth,
  requireRole("ADMIN"),
  adminForceLogout
);
r.patch("/users/:id/role", requireAuth, requireRole("ADMIN"), adminSetRole);

export default r;