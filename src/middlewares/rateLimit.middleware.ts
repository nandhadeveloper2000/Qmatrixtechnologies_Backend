import rateLimit from "express-rate-limit";
import { env } from "../config/env";

function createRateLimiter(options: {
  windowMs?: number;
  max: number;
  message: string;
}) {
  return rateLimit({
    windowMs: options.windowMs ?? env.GENERAL_RATE_LIMIT_WINDOW_MS,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: options.message,
    },
  });
}

export const generalApiLimiter = createRateLimiter({
  max: env.GENERAL_RATE_LIMIT_MAX,
  message: "Too many requests. Please try again shortly.",
});

export const loginRateLimiter = createRateLimiter({
  max: env.LOGIN_RATE_LIMIT_MAX,
  message: "Too many login attempts. Please wait before trying again.",
});

export const refreshRateLimiter = createRateLimiter({
  max: env.REFRESH_RATE_LIMIT_MAX,
  message: "Too many session refresh attempts. Please sign in again.",
});

export const contactRateLimiter = createRateLimiter({
  max: env.CONTACT_RATE_LIMIT_MAX,
  message:
    "Too many contact form submissions from this connection. Please try again later.",
});

export const enquiryRateLimiter = createRateLimiter({
  max: env.ENQUIRY_RATE_LIMIT_MAX,
  message:
    "Too many enquiry submissions from this connection. Please try again later.",
});
