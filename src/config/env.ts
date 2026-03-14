import dotenv from "dotenv";

dotenv.config();

function required(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function toBool(value: string | undefined, fallback = false) {
  if (value == null) return fallback;
  return String(value).trim().toLowerCase() === "true";
}

function toArray(value: string | undefined): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export const env = {
  PORT: Number(process.env.PORT || 3000),
  MONGODB_URI: required("MONGODB_URI", process.env.MONGODB_URI),

  FRONTEND_URLS: required("FRONTEND_URLS", process.env.FRONTEND_URLS),
  COOKIE_SECURE: toBool(process.env.COOKIE_SECURE, false),

  NODEMAILER_EMAIL: required("NODEMAILER_EMAIL", process.env.NODEMAILER_EMAIL),
  NODEMAILER_PASSWORD: required(
    "NODEMAILER_PASSWORD",
    process.env.NODEMAILER_PASSWORD
  ),
  RESEND_API_KEY: required("RESEND_API_KEY", process.env.RESEND_API_KEY),
  OTP_FROM_EMAIL: required("OTP_FROM_EMAIL", process.env.OTP_FROM_EMAIL),
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL || "",

  JWT_ACCESS_SECRET: required(
    "JWT_ACCESS_SECRET",
    process.env.JWT_ACCESS_SECRET
  ),
  JWT_REFRESH_SECRET: required(
    "JWT_REFRESH_SECRET",
    process.env.JWT_REFRESH_SECRET
  ),
  JWT_ACCESS_EXPIRES_IN: required(
    "JWT_ACCESS_EXPIRES_IN",
    process.env.JWT_ACCESS_EXPIRES_IN
  ),
  JWT_REFRESH_EXPIRES_IN: required(
    "JWT_REFRESH_EXPIRES_IN",
    process.env.JWT_REFRESH_EXPIRES_IN
  ),

  OTP_PEPPER: required("OTP_PEPPER", process.env.OTP_PEPPER),
  REFRESH_PEPPER: required("REFRESH_PEPPER", process.env.REFRESH_PEPPER),
  ENABLE_LOGIN_OTP: toBool(process.env.ENABLE_LOGIN_OTP, true),

  MASTER_GOOGLE_EMAILS: toArray(process.env.MASTER_GOOGLE_EMAILS),

  CLOUDINARY_CLOUD_NAME: required(
    "CLOUDINARY_CLOUD_NAME",
    process.env.CLOUDINARY_CLOUD_NAME
  ),
  CLOUDINARY_API_KEY: required(
    "CLOUDINARY_API_KEY",
    process.env.CLOUDINARY_API_KEY
  ),
  CLOUDINARY_API_SECRET: required(
    "CLOUDINARY_API_SECRET",
    process.env.CLOUDINARY_API_SECRET
  ),
};