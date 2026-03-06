import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { createBlog, listBlogs, updateBlog, deleteBlog } from "../controllers/blog.controller";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN","USER","EDITOR"), listBlogs);
router.post("/", requireAuth, requireRole("ADMIN","USER","EDITOR"), createBlog);
router.patch("/:id", requireAuth, requireRole("ADMIN","USER","EDITOR"), updateBlog);
router.delete("/:id", requireAuth, requireRole("ADMIN","USER"), deleteBlog);

export default router;