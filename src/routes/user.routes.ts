import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { upload } from "../middlewares/upload.middleware";
import { validateObjectId } from "../middlewares/objectId.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  adminCreateUserBodySchema,
  adminUpdateUserBodySchema,
  selfUpdateUserBodySchema,
} from "../validation/requestSchemas";
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

router.get("/me", requireAuth, getMyProfile);
router.put(
  "/me",
  requireAuth,
  validateRequest({ body: selfUpdateUserBodySchema }),
  updateProfile
);
router.put("/me/avatar", requireAuth, upload.single("avatar"), uploadAvatar);
router.delete("/me/avatar", requireAuth, deleteAvatar);

router.get("/", requireAuth, requireRole("ADMIN"), adminListUsers);
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({ body: adminCreateUserBodySchema }),
  adminCreateUser
);
router.get("/:id", requireAuth, requireRole("ADMIN"), validateObjectId(), getUserById);
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateObjectId(),
  validateRequest({ body: adminUpdateUserBodySchema }),
  adminUpdateUser
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateObjectId(),
  adminDeleteUser
);
router.put(
  "/:id/avatar",
  requireAuth,
  requireRole("ADMIN"),
  validateObjectId(),
  upload.single("avatar"),
  uploadAvatar
);
router.delete(
  "/:id/avatar",
  requireAuth,
  requireRole("ADMIN"),
  validateObjectId(),
  deleteAvatar
);

export default router;
