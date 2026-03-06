import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

async function start() {
  await connectDB();
  app.listen(env.PORT, () => console.log(`✅ API running on :${env.PORT}`));
}

start().catch(err => {
  console.error("❌ Start failed:", err);
  process.exit(1);
});