import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "test" | "production";

const PROD_ORIGINS = [
  "https://qmatrixtechnologies.com",
  "https://www.qmatrixtechnologies.com",
];

const DEV_ORIGINS = [
  ...PROD_ORIGINS,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function readFirst(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function required(name: string, ...values: Array<string | undefined>) {
  const value = readFirst(...values);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function toBool(value: string | undefined, fallback = false) {
  if (value == null) return fallback;

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function toInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function toArray(value: string | undefined): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function toOriginList(value: string | undefined, fallback: string[]) {
  const origins = String(value || "")
    .split(",")
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);

  return [...new Set((origins.length ? origins : fallback).map(normalizeOrigin))];
}

function resolveNodeEnv(value: string | undefined): NodeEnv {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

const NODE_ENV = resolveNodeEnv(process.env.NODE_ENV);
const defaultOrigins = NODE_ENV === "production" ? PROD_ORIGINS : DEV_ORIGINS;
const frontendUrls = readFirst(
  process.env.FRONTEND_URLS,
  process.env.FRONTEND_URL,
  defaultOrigins.join(",")
);

export const env = {
  NODE_ENV,
  PORT: toInt(process.env.PORT, 5000),
  MONGODB_URI: required(
    "MONGODB_URI or MONGO_URI",
    process.env.MONGODB_URI,
    process.env.MONGO_URI
  ),

  FRONTEND_URLS: frontendUrls,
  FRONTEND_ORIGINS: toOriginList(frontendUrls, defaultOrigins),
  COOKIE_SECURE: toBool(process.env.COOKIE_SECURE, NODE_ENV === "production"),

  SMTP_HOST: readFirst(process.env.SMTP_HOST),
  SMTP_PORT: toInt(process.env.SMTP_PORT, 587),
  SMTP_USER: readFirst(process.env.SMTP_USER, process.env.NODEMAILER_EMAIL),
  SMTP_PASS: readFirst(process.env.SMTP_PASS, process.env.NODEMAILER_PASSWORD),
  NODEMAILER_EMAIL: required(
    "NODEMAILER_EMAIL or SMTP_USER",
    process.env.NODEMAILER_EMAIL,
    process.env.SMTP_USER
  ),
  NODEMAILER_PASSWORD: required(
    "NODEMAILER_PASSWORD or SMTP_PASS",
    process.env.NODEMAILER_PASSWORD,
    process.env.SMTP_PASS
  ),
  RESEND_API_KEY: required("RESEND_API_KEY", process.env.RESEND_API_KEY),
  OTP_FROM_EMAIL: required("OTP_FROM_EMAIL", process.env.OTP_FROM_EMAIL),
  CONTACT_FROM_EMAIL: readFirst(
    process.env.CONTACT_FROM_EMAIL,
    process.env.OTP_FROM_EMAIL
  ),
  CONTACT_ADMIN_EMAILS: toArray(
    readFirst(process.env.CONTACT_ADMIN_EMAILS, process.env.MASTER_GOOGLE_EMAILS)
  ),

  JWT_ACCESS_SECRET: required(
    "JWT_ACCESS_SECRET or JWT_SECRET",
    process.env.JWT_ACCESS_SECRET,
    process.env.JWT_SECRET
  ),
  JWT_REFRESH_SECRET: required(
    "JWT_REFRESH_SECRET or JWT_SECRET",
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_SECRET
  ),
  JWT_ACCESS_EXPIRES_IN: required(
    "JWT_ACCESS_EXPIRES_IN or JWT_EXPIRES_IN",
    process.env.JWT_ACCESS_EXPIRES_IN,
    process.env.JWT_EXPIRES_IN
  ),
  JWT_REFRESH_EXPIRES_IN: readFirst(
    process.env.JWT_REFRESH_EXPIRES_IN,
    process.env.JWT_EXPIRES_IN,
    "7d"
  ),

  OTP_PEPPER: required("OTP_PEPPER", process.env.OTP_PEPPER),
  REFRESH_PEPPER: required("REFRESH_PEPPER", process.env.REFRESH_PEPPER),
  ENABLE_LOGIN_OTP: toBool(process.env.ENABLE_LOGIN_OTP, true),
  OTP_MAX_ATTEMPTS: toInt(process.env.OTP_MAX_ATTEMPTS, 5),

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

  GENERAL_RATE_LIMIT_WINDOW_MS: toInt(
    process.env.GENERAL_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000
  ),
  GENERAL_RATE_LIMIT_MAX: toInt(process.env.GENERAL_RATE_LIMIT_MAX, 300),
  LOGIN_RATE_LIMIT_MAX: toInt(process.env.LOGIN_RATE_LIMIT_MAX, 5),
  REFRESH_RATE_LIMIT_MAX: toInt(process.env.REFRESH_RATE_LIMIT_MAX, 20),
  CONTACT_RATE_LIMIT_MAX: toInt(process.env.CONTACT_RATE_LIMIT_MAX, 8),
  ENQUIRY_RATE_LIMIT_MAX: toInt(process.env.ENQUIRY_RATE_LIMIT_MAX, 10),
  MAX_UPLOAD_SIZE_MB: toInt(process.env.MAX_UPLOAD_SIZE_MB, 5),
};
