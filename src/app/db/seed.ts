import bcryptjs from "bcryptjs";
import prisma from "./prisma.js";
import config from "../config/index.js";

export const seedAdmin = async () => {
  try {
    const adminEmail = config.admin.email;
    const adminPassword = config.admin.password;

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ Admin email or password not configured. Skipping seeding.");
      return;
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("ℹ️ Admin user already exists. Seeding skipped.");
      return;
    }

    const hashedPassword = await bcryptjs.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: hashedPassword,
        isVerified: true,
        role: "admin",
      },
    });

    console.log("✅ Admin user seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
};

import { fileURLToPath } from "node:url";

// If run directly via CLI (e.g., node / tsx)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  console.log("Running seed script directly...");
  seedAdmin()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
