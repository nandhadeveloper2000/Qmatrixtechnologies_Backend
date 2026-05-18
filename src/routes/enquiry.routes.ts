import { Router } from "express";
import {
  createEnquiry,
  listEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
} from "../controllers/enquiry.controller";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { validateObjectId } from "../middlewares/objectId.middleware";
import { enquiryRateLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post("/", enquiryRateLimiter, createEnquiry);

router.get("/", requireAuth, requireRole("ADMIN", "EDITOR"), listEnquiries);
router.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  validateObjectId(),
  getEnquiryById
);
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  validateObjectId(),
  updateEnquiry
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateObjectId(),
  deleteEnquiry
);

export default router;
