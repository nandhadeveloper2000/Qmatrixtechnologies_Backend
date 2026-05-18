import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model";

dotenv.config();

const MASTER_EMAILS = (process.env.MASTER_GOOGLE_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_PASSWORD = "562000";

async function seedAdmin() {
  const mongoUrl = process.env.MONGODB_URI;
  if (!mongoUrl) throw new Error("Missing MONGODB_URI in .env");

  await mongoose.connect(mongoUrl);
  console.log("✅ MongoDB connected");

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  for (const email of MASTER_EMAILS) {
    const existing = await UserModel.findOne({ email });

    if (!existing) {
      await UserModel.create({
        email,
        name: "Master Admin",
        role: "ADMIN",
        is_active: true,
        password_hash,
      });
      console.log(`✅ Created: ${email}`);
    } else {
      await UserModel.updateOne(
        { email },
        { $set: { password_hash, role: "ADMIN", is_active: true } }
      );
      console.log(`✅ Updated: ${email}`);
    }
  }

  await mongoose.disconnect();
  console.log("✅ Done");
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
