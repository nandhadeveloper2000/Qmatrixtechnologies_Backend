import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { verifyMailer } from "./config/mailer";

async function start() {
  await connectDB();

  try {
    await verifyMailer();
    console.log("✅ SMTP ready");
  } catch (err) {
    console.error("❌ SMTP verify failed:", err);
  }

  const port = Number(process.env.PORT || env.PORT || 3000);

  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ API running on port ${port}`);
  });
}

start().catch((err) => {
  console.error("❌ Start failed:", err);
  process.exit(1);
});