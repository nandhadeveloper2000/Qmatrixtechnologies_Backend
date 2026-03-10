import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, otp: string) {
  const mailOptions = {
    from: `"QMatrix Technologies" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject: "Your Login OTP",
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>QMatrix Login OTP</h2>
        <p>Your OTP is:</p>
        <div style="font-size:30px;font-weight:bold;letter-spacing:4px">${otp}</div>
        <p>This OTP is valid for <b>20 minutes</b>.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("OTP Email sent:", info.messageId);

  return info;
}