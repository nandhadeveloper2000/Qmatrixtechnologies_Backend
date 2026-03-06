import dotenv from "dotenv";

dotenv.config();

function required(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT || 3000),
  MONGODB_URI: required("MONGODB_URI", process.env.MONGODB_URI),

  FRONTEND_URL: required("FRONTEND_URL", process.env.FRONTEND_URL),
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",

  NODEMAILER_EMAIL: required("NODEMAILER_EMAIL", process.env.NODEMAILER_EMAIL),
  NODEMAILER_PASSWORD: required("NODEMAILER_PASSWORD", process.env.NODEMAILER_PASSWORD),

  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET),
  JWT_ACCESS_EXPIRES_IN: required("JWT_ACCESS_EXPIRES_IN", process.env.JWT_ACCESS_EXPIRES_IN),
  JWT_REFRESH_EXPIRES_IN: required("JWT_REFRESH_EXPIRES_IN", process.env.JWT_REFRESH_EXPIRES_IN),

  OTP_PEPPER: required("OTP_PEPPER", process.env.OTP_PEPPER),
  REFRESH_PEPPER: required("REFRESH_PEPPER", process.env.REFRESH_PEPPER),
  ENABLE_LOGIN_OTP: process.env.ENABLE_LOGIN_OTP === "true",

  MASTER_GOOGLE_EMAILS: (process.env.MASTER_GOOGLE_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean),

  CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME),
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET),
};