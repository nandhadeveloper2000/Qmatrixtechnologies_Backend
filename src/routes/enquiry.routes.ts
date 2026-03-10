import { Router } from "express";
import {
  createEnquiry,
  listEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
} from "../controllers/enquiry.controller";

const router = Router();

router.post("/", createEnquiry);
router.get("/", listEnquiries);
router.get("/:id", getEnquiryById);
router.put("/:id", updateEnquiry);
router.delete("/:id", deleteEnquiry);

export default router;