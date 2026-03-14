import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

const ADMIN_EMAILS = [
  "qmatrixt@gmail.com",
  "snandhadeveloper592000@gmail.com",
];

export async function verifyContactMailer() {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  if (!env.CONTACT_FROM_EMAIL) {
    throw new Error("CONTACT_FROM_EMAIL is missing");
  }

  console.log("✅ Contact mailer ready");
}

export async function sendContactAdminNotification(params: {
  firstName: string;
  lastName?: string;
  email: string;
  countryCode: string;
  phone: string;
  message: string;
}) {
  const { firstName, lastName, email, countryCode, phone, message } = params;

  const fullName = `${firstName} ${lastName || ""}`.trim();

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
      <div style="padding:24px 28px;background:linear-gradient(135deg,#082a5e,#a724e4,#8121fb);color:#ffffff;">
        <h2 style="margin:0;font-size:24px;">New Contact Form Message</h2>
        <p style="margin:8px 0 0 0;font-size:14px;opacity:0.95;">
          A new enquiry has been submitted from the QMatrix contact page.
        </p>
      </div>

      <div style="padding:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#0f172a;width:160px;">Name</td>
            <td style="padding:10px 0;color:#334155;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#0f172a;">Email</td>
            <td style="padding:10px 0;color:#334155;">${email}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#0f172a;">Phone</td>
            <td style="padding:10px 0;color:#334155;">${countryCode} ${phone}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#0f172a;vertical-align:top;">Message</td>
            <td style="padding:10px 0;color:#334155;line-height:1.7;">${message.replace(/\n/g, "<br/>")}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  `;

  const { data, error } = await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: ADMIN_EMAILS,
    replyTo: email,
    subject: `New Contact Message from ${fullName}`,
    html,
    text: `
New Contact Form Message

Name: ${fullName}
Email: ${email}
Phone: ${countryCode} ${phone}

Message:
${message}
    `,
  });

  if (error) {
    console.error("❌ Admin notification email error:", error);
    throw new Error(error.message || "Failed to send admin notification");
  }

  return data;
}

export async function sendContactAutoReply(params: {
  to: string;
  firstName: string;
}) {
  const { to, firstName } = params;
  const currentYear = new Date().getFullYear();

  const html = `
  <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
        <div style="padding:28px;background:linear-gradient(135deg,#082a5e,#a724e4,#8121fb);color:#ffffff;">
          <h1 style="margin:0;font-size:28px;">Thank you for contacting QMatrix</h1>
          <p style="margin:10px 0 0 0;font-size:14px;opacity:0.95;">
            We have received your message successfully.
          </p>
        </div>

        <div style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.8;color:#475569;">
            Hi <strong style="color:#111827;">${firstName}</strong>,
          </p>

          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.8;color:#475569;">
            Thank you for reaching out to <strong style="color:#111827;">QMatrix Technologies</strong>.
            Our team has received your message and will get back to you as soon as possible.
          </p>

          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.8;color:#475569;">
            We appreciate your interest in our courses and services.
          </p>

          <div style="margin-top:24px;padding:18px;border:1px solid #e5e7eb;border-radius:18px;background:#f8fafc;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
              This is an automated acknowledgement email. Our team will review your enquiry and respond shortly.
            </p>
          </div>
        </div>

        <div style="padding:20px 28px;border-top:1px solid #e5e7eb;background:#fcfcfd;text-align:center;">
          <div style="font-size:14px;font-weight:700;color:#111827;">QMatrix Technologies</div>
          <div style="margin-top:6px;font-size:12px;color:#94a3b8;">© ${currentYear} QMatrix Technologies. All rights reserved.</div>
        </div>
      </div>
    </div>
  </div>
  `;

  const { data, error } = await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: [to],
    subject: "We received your message - QMatrix Technologies",
    html,
    text: `Hi ${firstName}, we have received your message. Our team will get back to you shortly. - QMatrix Technologies`,
  });

  if (error) {
    console.error("❌ Auto reply email error:", error);
    throw new Error(error.message || "Failed to send auto reply");
  }

  return data;
}

export async function sendAdminReplyEmail(params: {
  to: string;
  firstName: string;
  replyMessage: string;
}) {
  const { to, firstName, replyMessage } = params;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
      <div style="padding:24px 28px;background:linear-gradient(135deg,#082a5e,#a724e4,#8121fb);color:#ffffff;">
        <h2 style="margin:0;font-size:24px;">Response from QMatrix Technologies</h2>
      </div>
      <div style="padding:28px;">
        <p style="font-size:15px;line-height:1.8;color:#475569;">Hi <strong style="color:#111827;">${firstName}</strong>,</p>
        <div style="font-size:15px;line-height:1.8;color:#334155;">
          ${replyMessage.replace(/\n/g, "<br/>")}
        </div>
      </div>
    </div>
  </div>
  `;

  const { data, error } = await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: [to],
    subject: "Reply from QMatrix Technologies",
    html,
    text: `Hi ${firstName},\n\n${replyMessage}`,
  });

  if (error) {
    console.error("❌ Admin reply email error:", error);
    throw new Error(error.message || "Failed to send reply email");
  }

  return data;
}