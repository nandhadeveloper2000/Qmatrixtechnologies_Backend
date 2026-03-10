// src/routes/enquiry.route.ts
import { Router } from "express";
import {
  createEnquiry,
  listEnquiries,
  updateEnquiry,
  deleteEnquiry,
} from "../controllers/enquiry.controller";

const router = Router();

router.post("/", createEnquiry);
router.get("/", listEnquiries);
router.patch("/:id", updateEnquiry);
router.delete("/:id", deleteEnquiry);

export default router;