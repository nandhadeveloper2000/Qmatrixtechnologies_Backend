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
import { validateObjectId } from "../middlewares/objectId.middleware";

const r = Router();

r.get("/users",  requireAuth, requireRole("ADMIN"), adminListUsers);
r.get("/admins", requireAuth, requireRole("ADMIN"), adminListAdmins);
r.put("/users/:id/active",        requireAuth, requireRole("ADMIN"), validateObjectId("id"), adminSetActive);
r.post("/users/:id/force-logout", requireAuth, requireRole("ADMIN"), validateObjectId("id"), adminForceLogout);
r.put("/users/:id/role",          requireAuth, requireRole("ADMIN"), validateObjectId("id"), adminSetRole);

export default r;