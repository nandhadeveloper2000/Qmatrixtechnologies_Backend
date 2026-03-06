import { Resend } from "resend";
import { env } from "./env";

const resend = new Resend(env.RESEND_API_KEY);

export async function verifyMailer() {
  console.log("✅ Resend mailer ready");
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

  const result = await resend.emails.send({
    from: env.OTP_FROM_EMAIL,
    to,
    subject: "Your QMTechnologies OTP",
    html,
    text: `Your QMTechnologies OTP is ${otp}. It expires in 10 minutes.`,
  });

  console.log("✅ OTP email sent:", result);
}