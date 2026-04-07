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

/* =========================
   PUBLIC (SEO FETCH)
========================= */
router.get("/public/:pageKey", getPageSEOByKey);

/* =========================
   ADMIN / EDITOR
========================= */

/* LIST ALL SEO */
router.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  listPageSEO
);

/* GET SINGLE */
router.get(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  getPageSEOByKey
);

/* UPSERT (CREATE + UPDATE) */
router.put(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  upsertPageSEO
);

/* DELETE */
router.delete(
  "/admin/:pageKey",
  requireAuth,
  requireRole("ADMIN"),
  deletePageSEO
);

export default router;