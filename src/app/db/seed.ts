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

export const seedCategoriesAndProducts = async () => {
  try {
    // Clear any existing products and categories
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    console.log("ℹ️ Cleared existing Categories and Products from database.");

    // Seed Categories
    const categories = [
      {
        name: "Premium Electronics",
        slug: "electronics",
        parent: "--",
        productsCount: 6,
        status: "Active",
        visWeb: true,
        visMobile: true,
        iconType: "electronics",
      },
      {
        name: "Minimalist Fashion",
        slug: "fashion",
        parent: "--",
        productsCount: 6,
        status: "Active",
        visWeb: true,
        visMobile: true,
        iconType: "clothing",
      },
      {
        name: "Modern Home",
        slug: "home",
        parent: "--",
        productsCount: 6,
        status: "Active",
        visWeb: true,
        visMobile: true,
        iconType: "other",
      },
    ];

    await prisma.category.createMany({
      data: categories,
    });
    console.log("✅ Categories seeded successfully!");

    // Seed Products
    const products = [
      // Electronics (6 products)
      {
        name: "Minimalist Chronograph",
        description: "Swiss movement luxury timepiece featuring sapphire crystal glass, matte steel finish, and Italian leather strap.",
        category: "electronics",
        brand: "LUXE",
        sku: "MIN-CHRONO-001",
        price: 450.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Over-Ear ANC Headphones",
        description: "Studio quality audio with active noise cancellation, memory foam ear cups, and 30-hour battery life.",
        category: "electronics",
        brand: "AURA",
        sku: "ANC-HEAD-002",
        price: 349.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Noise Cancelling Earbuds",
        description: "True wireless earbuds with active noise cancellation, touch controls, and wireless charging case.",
        category: "electronics",
        brand: "AURA",
        sku: "ANC-BUDS-003",
        price: 249.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "AuraBook Pro 14\"",
        description: "Unmatched performance in a sleek aluminum chassis. Packed with a high-refresh-rate Retina display and all-day battery life.",
        category: "electronics",
        brand: "AURA",
        sku: "LAP-ABP14-004",
        price: 1299.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Type-C Hub 8-in-1",
        description: "Aluminum USB-C hub with 4K HDMI, SD card reader, USB 3.0 ports, and Power Delivery pass-through.",
        category: "electronics",
        brand: "LUXE",
        sku: "HUB-8IN1-005",
        price: 65.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Desktop Audio Monitors",
        description: "Active desktop monitor speakers offering balanced sound, Bluetooth connectivity, and wood finish.",
        category: "electronics",
        brand: "LUXE",
        sku: "AUD-MON-006",
        price: 150.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },

      // Fashion (6 products)
      {
        name: "Premium Sneakers",
        description: "Handcrafted sneakers made with sustainable materials, full-grain leather, and durable rubber soles.",
        category: "fashion",
        brand: "LUXE",
        sku: "FSH-SNEAK-101",
        price: 135.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "MacBook Pro Sleeve",
        description: "Full-grain leather laptop sleeve with soft wool felt lining and secure magnetic closure.",
        category: "fashion",
        brand: "LUXE",
        sku: "FSH-SLEEV-102",
        price: 85.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Minimalist Leather Cardholder",
        description: "Sleek card wallet made from vegetable-tanned leather, holding up to 6 cards and cash.",
        category: "fashion",
        brand: "LUXE",
        sku: "FSH-CARD-103",
        price: 40.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Waterproof Commuter Backpack",
        description: "Matte finish waterproof rolltop backpack with dedicated laptop compartment and ergonomic straps.",
        category: "fashion",
        brand: "LUXE",
        sku: "FSH-BACK-104",
        price: 120.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Merino Wool Beanie",
        description: "Soft, breathable merino wool beanie designed for warmth and minimalist style.",
        category: "fashion",
        brand: "LUXE",
        sku: "FSH-BEAN-105",
        price: 30.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Polarized Classic Sunglasses",
        description: "Acetate frame classic sunglasses with polarized lenses offering 100% UV protection.",
        category: "fashion",
        brand: "LUXE",
        sku: "FSH-SUNG-106",
        price: 95.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },

      // Home (6 products)
      {
        name: "Smart Desk Lamp",
        description: "Minimalist aluminum desk lamp with adjustable color temperature, brightness control, and wireless charging base.",
        category: "home",
        brand: "LUXE",
        sku: "HOM-LAMP-201",
        price: 120.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Ceramic Pour-Over Coffee Maker",
        description: "Slow drip ceramic coffee maker with heat-resistant matte finish and wooden collar holder.",
        category: "home",
        brand: "LUXE",
        sku: "HOM-POUR-202",
        price: 65.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Ergonomic Office Chair",
        description: "Dynamic lumbar support, breathable mesh back, adjustable armrests and headrest for workspace comfort.",
        category: "home",
        brand: "LUXE",
        sku: "HOM-CHAIR-203",
        price: 890.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Minimalist Leather Desk Mat",
        description: "Top-grain premium leather desk mat with non-slip backing, protecting your workspace in style.",
        category: "home",
        brand: "LUXE",
        sku: "HOM-DMAT-204",
        price: 45.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Oak Monitor Stand",
        description: "Solid oak monitor riser providing ergonomic viewing height and space-saving keyboard storage.",
        category: "home",
        brand: "LUXE",
        sku: "HOM-MSTD-205",
        price: 120.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
      {
        name: "Self-Watering Ceramic Planter",
        description: "Elegant ceramic planter featuring a self-watering reservoir system perfect for desk succulents and plants.",
        category: "home",
        brand: "LUXE",
        sku: "HOM-PLNT-206",
        price: 35.00,
        inventoryType: "untracked",
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=600&auto=format&fit=crop",
        status: "Published",
      },
    ];

    await prisma.product.createMany({
      data: products,
    });
    console.log("✅ Products seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding Categories and Products:", error);
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
    await seedCategoriesAndProducts();
  })()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
