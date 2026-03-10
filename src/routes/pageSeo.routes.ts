import { Router } from "express";
import {
  getPageSEOByKey,
  upsertPageSEO,
  listPageSEO,
  deletePageSEO,
} from "../controllers/pageSeo.controller";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";

const router = Router();

/* PUBLIC ROUTES */
router.get("/public/:pageKey", getPageSEOByKey);

/* ADMIN ROUTES */
router.get("/admin", requireAuth, requireRole("ADMIN"), listPageSEO);

router.post(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN"),
  upsertPageSEO
);

router.put(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN"),
  upsertPageSEO
);

router.delete(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN"),
  deletePageSEO
);

export default router;