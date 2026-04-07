import { Router } from "express";
import {
  deletePageSEO,
  getPageSEOByKey,
  listPageSEO,
  upsertPageSEO,
} from "../controllers/pageSeo.controller";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";

const router = Router();

/* PUBLIC */
router.get("/public/:pageKey", getPageSEOByKey);

/* ADMIN / EDITOR */
router.get("/admin", requireAuth, requireRole("ADMIN", "EDITOR"), listPageSEO);

router.post(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  upsertPageSEO
);

router.put(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  upsertPageSEO
);

router.delete(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN"),
  deletePageSEO
);

export default router;