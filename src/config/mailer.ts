import { Resend } from "resend";
import { env } from "./env";

const resend = new Resend(env.RESEND_API_KEY);

export async function verifyMailer() {
  console.log("✅ Resend mailer ready");
}

export async function sendOtpEmail(to: string, otp: string) {
  const currentYear = new Date().getFullYear();

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>QMatrix Technologies OTP</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Inter,Arial,Helvetica,sans-serif;color:#111827;">
      
      <div style="width:100%;background:#f5f7fb;padding:40px 16px;">
        <div style="max-width:640px;margin:0 auto;">

          <!-- Top soft glow area -->
          <div
            style="
              height:110px;
              background:
                radial-gradient(circle at top left, rgba(129,33,251,0.18), transparent 45%),
                radial-gradient(circle at top right, rgba(167,36,228,0.14), transparent 42%),
                linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
              border:1px solid #e5e7eb;
              border-bottom:none;
              border-radius:28px 28px 0 0;
            "
          ></div>

          <!-- Main card -->
          <div
            style="
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-top:none;
              border-radius:0 0 28px 28px;
              overflow:hidden;
              box-shadow:0 12px 40px rgba(15,23,42,0.08);
            "
          >
            <!-- Brand -->
            <div style="padding:0 40px 28px 40px;margin-top:-78px;text-align:center;">
              <div
                style="
                  display:inline-block;
                  background:#ffffff;
                  border:1px solid #eef2f7;
                  border-radius:22px;
                  padding:18px 22px;
                  box-shadow:0 8px 24px rgba(15,23,42,0.06);
                "
              >
                <img
                  src="https://res.cloudinary.com/dfbbnzwmc/image/upload/f_auto,q_auto,w_1000/qmatrix/logo"
                  alt="QMatrix Technologies"
                  style="display:block;max-width:220px;width:100%;height:auto;margin:0 auto;"
                />
              </div>
            </div>

            <!-- Content -->
            <div style="padding:0 40px 36px 40px;">
              <div
                style="
                  display:inline-block;
                  padding:6px 12px;
                  border-radius:999px;
                  background:#f3f0ff;
                  color:#6d28d9;
                  font-size:12px;
                  font-weight:700;
                  letter-spacing:0.3px;
                  margin-bottom:18px;
                "
              >
                Secure Login Verification
              </div>

              <h1
                style="
                  margin:0 0 12px 0;
                  font-size:30px;
                  line-height:1.2;
                  font-weight:700;
                  color:#0f172a;
                  letter-spacing:-0.4px;
                "
              >
                Your one-time verification code
              </h1>

              <p
                style="
                  margin:0 0 26px 0;
                  font-size:15px;
                  line-height:1.75;
                  color:#475569;
                "
              >
                Use the verification code below to continue signing in to your
                <span style="font-weight:700;color:#111827;">QMatrix Technologies</span>
                account. This code is private and should not be shared with anyone.
              </p>

              <!-- OTP card -->
              <div
                style="
                  margin:30px 0 28px 0;
                  border:1px solid #e9edf5;
                  border-radius:24px;
                  background:
                    linear-gradient(180deg, #fcfcff 0%, #f8faff 100%);
                  padding:30px 24px;
                  text-align:center;
                "
              >
                <div
                  style="
                    font-size:12px;
                    letter-spacing:1.2px;
                    text-transform:uppercase;
                    color:#64748b;
                    font-weight:700;
                    margin-bottom:12px;
                  "
                >
                  Verification Code
                </div>

                <div
                  style="
                    display:inline-block;
                    padding:18px 26px;
                    border-radius:18px;
                    border:1px solid #e5e7eb;
                    background:#ffffff;
                    box-shadow:0 6px 18px rgba(15,23,42,0.05);
                    font-size:36px;
                    line-height:1;
                    font-weight:800;
                    letter-spacing:12px;
                    color:#111827;
                  "
                >
                  ${otp}
                </div>

                <div
                  style="
                    margin-top:16px;
                    font-size:14px;
                    color:#475569;
                    line-height:1.6;
                  "
                >
                  This code expires in <strong style="color:#111827;">10 minutes</strong>.
                </div>
              </div>

              <!-- Info section -->
              <div
                style="
                  border:1px solid #eef2f7;
                  border-radius:20px;
                  background:#fbfcfe;
                  padding:18px 18px;
                  margin:0 0 22px 0;
                "
              >
                <div
                  style="
                    font-size:14px;
                    line-height:1.7;
                    color:#475569;
                  "
                >
                  <div style="margin:0 0 8px 0;">
                    <strong style="color:#111827;">Security note:</strong>
                    QMatrix will never ask you for this code by phone, message, or email.
                  </div>
                  <div>
                    If you didn’t request this login, you can safely ignore this email.
                  </div>
                </div>
              </div>

              <p
                style="
                  margin:0;
                  font-size:13px;
                  line-height:1.7;
                  color:#94a3b8;
                "
              >
                Having trouble? Make sure you entered the most recent OTP sent to your email address.
              </p>
            </div>

            <!-- Footer -->
            <div
              style="
                border-top:1px solid #eef2f7;
                background:#fcfcfd;
                padding:22px 40px 30px 40px;
                text-align:center;
              "
            >
              <div
                style="
                  font-size:14px;
                  font-weight:700;
                  color:#111827;
                  margin-bottom:6px;
                "
              >
                QMatrix Technologies
              </div>

              <div
                style="
                  font-size:13px;
                  line-height:1.7;
                  color:#64748b;
                "
              >
                Empowering future tech professionals with modern learning experiences.
              </div>

              <div
                style="
                  margin-top:12px;
                  font-size:12px;
                  color:#94a3b8;
                "
              >
                © ${currentYear} QMatrix Technologies. All rights reserved.
              </div>
            </div>
          </div>

        </div>
      </div>
    </body>
  </html>
  `;

  const result = await resend.emails.send({
    from: env.OTP_FROM_EMAIL,
    to,
    subject: "Your QMatrix verification code",
    html,
    text: `Your QMatrix Technologies verification code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
  });

  console.log("✅ OTP email sent:", result);
}