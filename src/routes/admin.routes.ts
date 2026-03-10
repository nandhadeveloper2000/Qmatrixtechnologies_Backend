import { Router } from "express";
import { getAdminDashboard } from "../controllers/admin.controller";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.get(
  "/dashboard",
  requireAuth,
  requireRole("ADMIN", "EDITOR", "USER"),
  getAdminDashboard
);

export default router;