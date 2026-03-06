import { Router } from "express";
import { requestOtp, verifyOtp, refresh, logout } from "../controllers/auth.controller";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;