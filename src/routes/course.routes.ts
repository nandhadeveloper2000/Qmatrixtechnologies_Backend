import { Router } from "express";
import {
  uploadCourseImage,
  deleteCourseImage,
  createCourse,
  adminListCourses,
  listPublishedCourses,
  adminGetCourseById,
  getPublishedCourseBySlug,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller";
import { upload } from "../middlewares/upload.middleware";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";

const router = Router();

/* ADMIN */
router.get(
  "/admin/all",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  adminListCourses
);

router.get(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  adminGetCourseById
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  createCourse
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  updateCourse
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteCourse
);

router.post(
  "/upload-image",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  upload.single("image"),
  uploadCourseImage
);

router.delete(
  "/delete-image",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  deleteCourseImage
);

/* PUBLIC */
router.get("/", listPublishedCourses);
router.get("/:slug", getPublishedCourseBySlug);

export default router;