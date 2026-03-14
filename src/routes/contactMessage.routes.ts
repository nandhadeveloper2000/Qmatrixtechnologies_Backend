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

const router = Router();

// Public
router.post("/create", createContactMessage);

// Admin
router.get("/all", requireAuth, requireRole("ADMIN"), getAllContactMessages);
router.get("/:id", requireAuth, requireRole("ADMIN"), getContactMessageById);
router.patch("/:id/status", requireAuth, requireRole("ADMIN"), updateContactStatus);
router.post("/:id/reply", requireAuth, requireRole("ADMIN"), replyToContactMessage);

export default router;