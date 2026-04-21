import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

async function seed() {
  await connectDB();
  const exists = await User.findOne({ role: "superadmin" });
  if (exists) {
    console.log("Super admin already exists");
    process.exit(0);
  }

  const fullName = process.env.SEED_SUPERADMIN_NAME || "Super Admin";
  const email = process.env.SEED_SUPERADMIN_EMAIL || "superadmin@sis.local";
  const password = process.env.SEED_SUPERADMIN_PASSWORD || "admin123";

  await User.create({ fullName, email, password, role: "superadmin" });
  console.log("Super admin created:", email);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
