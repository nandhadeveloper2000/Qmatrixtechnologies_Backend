import { Router } from "express";
import {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactStatus,
  replyToContactMessage,
} from "../controllers/contactMessage.controller";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { validateObjectId } from "../middlewares/objectId.middleware";
import { contactRateLimiter } from "../middlewares/rateLimit.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  contactReplyBodySchema,
  contactStatusBodySchema,
} from "../validation/requestSchemas";

const router = Router();

router.post("/create", contactRateLimiter, createContactMessage);

router.get("/all", requireAuth, requireRole("ADMIN", "EDITOR"), getAllContactMessages);
router.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  validateObjectId(),
  getContactMessageById
);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  validateObjectId(),
  validateRequest({ body: contactStatusBodySchema }),
  updateContactStatus
);
router.post(
  "/:id/reply",
  requireAuth,
  requireRole("ADMIN"),
  validateObjectId(),
  validateRequest({ body: contactReplyBodySchema }),
  replyToContactMessage
);

export default router;
