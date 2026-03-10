import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
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

/* ADMIN */
router.get("/", requireAuth, requireRole("ADMIN", "EDITOR", "USER"), listBlogs);
router.get("/admin/:id", requireAuth, requireRole("ADMIN", "EDITOR", "USER"), getBlogById);
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR", "USER"), createBlog);
router.put("/:id", requireAuth, requireRole("ADMIN", "EDITOR", "USER"), updateBlog);
router.delete("/:id", requireAuth, requireRole("ADMIN", "USER"), deleteBlog);

export default router;