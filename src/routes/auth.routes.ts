import { Router } from "express";
import { login, refresh, logout } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth";
import {
  loginRateLimiter,
  refreshRateLimiter,
} from "../middlewares/rateLimit.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import { loginBodySchema, refreshBodySchema } from "../validation/requestSchemas";

const router = Router();

router.post("/login", loginRateLimiter, validateRequest({ body: loginBodySchema }), login);
router.post(
  "/refresh",
  refreshRateLimiter,
  validateRequest({ body: refreshBodySchema }),
  refresh
);
router.post("/logout", requireAuth, logout);

export default router;
