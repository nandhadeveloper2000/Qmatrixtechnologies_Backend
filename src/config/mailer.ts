import nodemailer from "nodemailer";
import { env } from "./env";

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: env.NODEMAILER_EMAIL,
    pass: env.NODEMAILER_PASSWORD,
  },
  logger: true,
  debug: true,
});

export async function verifyMailer() {
  try {
    await mailer.verify();
    console.log("✅ SMTP ready");
  } catch (error) {
    console.error("❌ SMTP verify failed:", error);
    throw error;
  }
}

export async function sendOtpEmail(to: string, otp: string) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="margin:0 0 12px;color:#111827">QMTechnologies Login OTP</h2>
      <p style="margin:0 0 16px;color:#374151">Use the OTP below to continue your login.</p>

      <div style="margin:20px 0;padding:16px;background:#f3f4f6;border-radius:10px;text-align:center">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827">${otp}</span>
      </div>

      <p style="margin:0 0 8px;color:#374151">This OTP expires in 10 minutes.</p>
      <p style="margin:0;color:#6b7280;font-size:14px">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    const info = await mailer.sendMail({
      from: `"QMTechnologies" <${env.NODEMAILER_EMAIL}>`,
      to,
      subject: "Your QMTechnologies OTP",
      text: `Your QMTechnologies OTP is ${otp}. It expires in 10 minutes.`,
      html,
    });

    console.log("✅ OTP email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ sendOtpEmail failed:", error);
    throw error;
  }
}