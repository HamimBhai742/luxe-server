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

export const seedFaqs = async () => {
  try {
    // Clear any existing FAQs to ensure we start with our clean set
    await prisma.faq.deleteMany({});
    console.log("ℹ️ Cleared existing FAQs from database.");

    const faqs = [
      {
        question: "What is LUXE?",
        answer: "LUXE is a premium boutique workspace brand designing minimal, elegant, and high-performance peripherals (mechanical keyboards, precision mice, audio docks, and desk mats) tailored for professional creators and developer workspaces.",
        category: "General",
        order: 1,
      },
      {
        question: "How can I contact customer support?",
        answer: "You can submit a support ticket directly through your User Dashboard, or email us at support@luxe.design. Our team is available Monday through Friday from 9 AM to 6 PM EST.",
        category: "General",
        order: 2,
      },
      {
        question: "What makes LUXE peripherals different from regular electronics?",
        answer: "LUXE components prioritize minimalist, distraction-free aesthetics. We source high-grade mechanical parts, matte aluminum shells, and Swiss movement designs that are built to look premium and outlast ordinary plastic devices.",
        category: "Products",
        order: 3,
      },
      {
        question: "Are these gadgets compatible with macOS, Windows, and Linux?",
        answer: "Yes. All of our workspace electronics, keyboards, and audio docks support universal plug-and-play protocols and connect seamlessly across macOS, Windows, Linux, and mobile operating systems.",
        category: "Products",
        order: 4,
      },
      {
        question: "How do I care for and clean my LUXE products?",
        answer: "Use a dry or slightly damp microfibre cloth to wipe down aluminum surfaces. Avoid using harsh chemical sprays or submersing any items in water. Keyboard keycaps can be removed and cleaned using the tool included in your original box.",
        category: "Products",
        order: 5,
      },
      {
        question: "How long does shipping take, and do you ship worldwide?",
        answer: "We ship to over 85 countries worldwide. Standard shipping takes 5-7 business days, while express courier pathways take 2-3 business days. All shipments include carbon-offset transport pathways.",
        category: "Shipping",
        order: 6,
      },
      {
        question: "How can I track my package?",
        answer: "Once your order is processed and leaves our warehouse, you will receive a tracking link via email. You can also view your shipment status in real-time from the \"Orders\" page under your user dashboard.",
        category: "Shipping",
        order: 7,
      },
      {
        question: "What payment gateways are supported during checkout?",
        answer: "We accept all major international credit cards, Apple Pay, Google Pay, Stripe, and PayPal. All transaction information is encrypted and secured.",
        category: "Payments",
        order: 8,
      },
      {
        question: "Are there any monthly subscription fees?",
        answer: "No. All hardware purchases are one-time payments. Any associated custom configuration software we release is completely free to download and use.",
        category: "Payments",
        order: 9,
      },
      {
        question: "What is your warranty and refund policy?",
        answer: "We offer a 2-year comprehensive hardware warranty on all workspace items. Return requests can be initiated within 14 calendar days of receipt, provided the items remain in their original packaging.",
        category: "Warranties",
        order: 10,
      },
    ];

    await prisma.faq.createMany({
      data: faqs,
    });

    console.log("✅ FAQs seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding FAQs:", error);
  }
};

import { fileURLToPath } from "node:url";

// If run directly via CLI (e.g., node / tsx)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  console.log("Running seed script directly...");
  (async () => {
    await seedAdmin();
    await seedFaqs();
  })()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
