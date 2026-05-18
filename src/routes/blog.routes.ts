import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validateObjectId } from "../middlewares/objectId.middleware";
import { requireRole } from "../middlewares/rbac";
import {
  createBlog,
  listBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  listPublishedBlogs,
} from "../controllers/blog.controller";

const router = Router();

/* PUBLIC */
router.get("/public", listPublishedBlogs);
router.get("/public/:slug", getBlogBySlug);

/* ADMIN / EDITOR */
router.get("/", requireAuth, requireRole("ADMIN", "EDITOR"), listBlogs);
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), createBlog);

router.get(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  validateObjectId(),
  getBlogById
);
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  validateObjectId(),
  updateBlog
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateObjectId(),
  deleteBlog
);

export default router;
