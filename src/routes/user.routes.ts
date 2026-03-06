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

/** current logged-in user */
router.get("/me", requireAuth, getMyProfile);
router.put("/me", requireAuth, updateProfile);
router.put("/me/avatar", requireAuth, upload.single("avatar"), uploadAvatar);
router.delete("/me/avatar", requireAuth, deleteAvatar);

/** admin user management */
router.get("/", requireAuth, requireRole("ADMIN"), adminListUsers);
router.post("/", requireAuth, requireRole("ADMIN"), adminCreateUser);
router.get("/:id", requireAuth, requireRole("ADMIN"), getUserById);
router.patch("/:id", requireAuth, requireRole("ADMIN"), adminUpdateUser);
router.delete("/:id", requireAuth, requireRole("ADMIN"), adminDeleteUser);
router.put("/:id/avatar", requireAuth, requireRole("ADMIN"), upload.single("avatar"), uploadAvatar);
router.delete("/:id/avatar", requireAuth, requireRole("ADMIN"), deleteAvatar);

export default router;