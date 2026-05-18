import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { verifyContactMailer } from "./config/contactMailer";
import { verifyMailer } from "./config/mailer";

async function start() {
  await connectDB();

  try {
    await Promise.all([verifyMailer(), verifyContactMailer()]);
  } catch (err) {
    if (env.NODE_ENV !== "production") {
      console.error("Mailer verification failed:", err);
    }
  }

  const port = env.PORT;

  app.listen(port, "0.0.0.0", () => {
    if (env.NODE_ENV !== "production") {
      console.log(`API running on port ${port}`);
    }
  });
}

start().catch((err) => {
  console.error("Start failed:", err);
  process.exit(1);
});
