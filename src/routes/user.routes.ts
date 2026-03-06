import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { upload } from "../middlewares/upload.middleware";
import {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  getMyProfile,
  getUserById,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from "../controllers/user.controller";

const router = Router();

/** current user */
router.get("/me", requireAuth, getMyProfile);

/** admin routes */
router.get("/", requireAuth, requireRole("ADMIN"), adminListUsers);
router.post("/", requireAuth, requireRole("ADMIN"), adminCreateUser);
router.patch("/:id", requireAuth, requireRole("ADMIN"), adminUpdateUser);
router.delete("/:id", requireAuth, requireRole("ADMIN"), adminDeleteUser);

/** profile routes */
router.get("/:id", requireAuth, getUserById);
router.put("/:id", requireAuth, updateProfile);
router.put("/:id/avatar", requireAuth, upload.single("avatar"), uploadAvatar);
router.delete("/:id/avatar", requireAuth, deleteAvatar);

export default router;