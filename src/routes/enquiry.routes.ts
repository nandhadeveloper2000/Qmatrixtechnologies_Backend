import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry } from "../controllers/enquiry.controller";

const router = Router();

// Public create (from website form)
router.post("/", createEnquiry);

// USER
router.get("/", requireAuth, requireRole("MASTER","USER","EDITOR"), listEnquiries);
router.patch("/:id", requireAuth, requireRole("MASTER","USER","EDITOR"), updateEnquiry);
router.delete("/:id", requireAuth, requireRole("MASTER","USER"), deleteEnquiry);

export default router;