import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

// Helper token tokenizer and similarity classifier in case Gemini key is missing
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function calculateSimilarity(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  return intersection.size / (set1.size + set2.size - intersection.size);
}

const fallbackResponse = (messageText: string, productsList: any[], ordersList: any[], userEmail: string, userName: string) => {
  const BOT_CATEGORIES = [
    {
      id: "greetings",
      questions: ["hi", "hello", "hey", "start", "greetings", "anyone there", "help", "who are you"],
      response: "Hello! Welcome to Aura Marketplace. I am your Aura Assistant. How can I help you today? You can ask me about our premium products, shipping services, returns policy, how to submit reviews, or earning Aura loyalty points!",
    },
    {
      id: "products",
      questions: ["what products do you sell", "list items", "buy", "shop", "headphones", "watch", "camera", "shoes"],
      response: "We offer a curated selection of premium products including Sony Headphones, Apple Watch, Polaroid Camera, and Nike Air Max 270. You can browse details on the Collections page!",
    },
    {
      id: "points",
      questions: ["loyalty points", "aura points", "points balance", "earn points"],
      response: "Aura Points is our loyalty program! You earn 5 Aura Points for every $1 spent on our store. These are displayed dynamically on your Dashboard Overview.",
    },
    {
      id: "shipping",
      questions: ["shipping options", "delivery time", "shipping policy", "track my order"],
      response: "We offer Standard Shipping (3-5 business days) and Express Shipping (1-2 business days). Track details on the Orders Dashboard.",
    },
    {
      id: "returns",
      questions: ["return policy", "refund", "return window", "exchange"],
      response: "We support free returns and exchanges within 30 days of delivery. Items must be in their original condition.",
    },
    {
      id: "reviews",
      questions: ["write a review", "upload photos to review", "star rating", "upload image"],
      response: "Go to your Orders Dashboard, locate the delivered item, and click Review Item to rate it and upload your review photo!",
    },
    {
      id: "payments",
      questions: ["payment methods", "stripe", "bkash", "checkout"],
      response: "We support secure checkouts with Stripe (credit cards) and bKash (mobile transfers).",
    },
    {
      id: "support",
      questions: ["contact support", "support email", "phone number", "help desk"],
      response: "Need direct help? Email support@auramarketplace.com or call +1 (555) 123-4567.",
    },
  ];

  const normalized = messageText.toLowerCase();
  const inputTokens = tokenize(normalized);

  let bestCategory: any = null;
  let maxScore = 0;

  for (const cat of BOT_CATEGORIES) {
    for (const question of cat.questions) {
      const qTokens = tokenize(question);
      const score = calculateSimilarity(inputTokens, qTokens);
      if (score > maxScore) {
        maxScore = score;
        bestCategory = cat;
      }
    }
  }

  // Keyword fallback
  if (maxScore <= 0.08) {
    for (const cat of BOT_CATEGORIES) {
      const matchedKeyword = cat.questions.some((q) => {
        const words = q.split(/\s+/);
        return words.some((w) => w.length > 3 && normalized.includes(w));
      });
      if (matchedKeyword) {
        bestCategory = cat;
        maxScore = 0.5;
        break;
      }
    }
  }

  const matchingProduct = productsList.find((p) => 
    normalized.includes(p.name.toLowerCase()) || 
    normalized.includes(p.description.toLowerCase()) ||
    (p.brand && normalized.includes(p.brand.toLowerCase()))
  );

  if (matchingProduct) {
    return `Yes! We carry **${matchingProduct.name}** in stock.\n\n• **Price**: $${matchingProduct.price.toFixed(2)}\n• **Description**: ${matchingProduct.description}\n• **Category**: ${matchingProduct.category}\n\nWould you like to buy it? You can view it here: **[View Product](/collections/${matchingProduct.id})**!`;
  }

  if (bestCategory && maxScore > 0.08) {
    if (bestCategory.id === "products" && productsList.length > 0) {
      const itemsText = productsList.slice(0, 5).map(p => `• **${p.name}** ($${p.price.toFixed(2)})`).join("\n");
      return `We currently offer these premium products in our catalog:\n\n${itemsText}\n\nYou can browse details, add products to your cart, or save to your wishlist on the **[Collections page](/collections)**!`;
    }
    if (bestCategory.id === "points" && userEmail) {
      const totalSpent = ordersList.reduce((sum, ord) => sum + ord.total, 0);
      const auraPoints = Math.floor(totalSpent * 5);
      return `Hi **${userName || "Customer"}**, you currently have **${auraPoints.toLocaleString()} Aura Points**!\n\nYou've spent a total of $${totalSpent.toFixed(2)} on our platform, earning 5 points for every dollar spent. Check out your points breakdown on your **[Dashboard](/dashboard)**.`;
    }
    if ((bestCategory.id === "shipping" || normalized.includes("my order") || normalized.includes("track my")) && userEmail) {
      if (ordersList.length > 0) {
        const recentOrder = ordersList[0];
        return `Your most recent order is **${recentOrder.orderId}**:\n\n• **Date**: ${recentOrder.date}\n• **Fulfillment Status**: **${recentOrder.fulfillmentStatus}**\n• **Payment Status**: **${recentOrder.paymentStatus}**\n• **Total**: $${recentOrder.total.toFixed(2)}\n\nYou can track and manage all your orders on your **[Orders Dashboard](/dashboard/orders)**!`;
      }
    }
    return bestCategory.response;
  }

  return "I couldn't find a direct match for your question. Here is a list of topics I can assist you with:\n\n" +
    "• **Shop Products**: Our catalog items, pricing and collections page.\n" +
    "• **Loyalty Points**: Earning and tracking Aura Points.\n" +
    "• **Shipping**: Estimates and tracking orders.\n" +
    "• **Submit Reviews**: Submitting reviews with star ratings and photo uploads.\n" +
    "• **Payments**: Stripe card checkout and bKash mobile payments.\n" +
    "• **Returns**: Our 30-day free returns policy.\n\n" +
    "Try using simpler keywords or select one of the quick suggestions below!";
};

const handleChat = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { message, email } = req.body;

  if (!message || message.trim() === "") {
    res.status(400).json({ success: false, message: "Message is required." });
    return;
  }

  // Load backend context
  const dbProducts = await prisma.product.findMany({ where: { status: "Active" } });
  
  let dbUser = null;
  let dbOrders: any[] = [];
  let userPoints = 0;

  if (email) {
    dbUser = await prisma.user.findUnique({ where: { email } });
    dbOrders = await prisma.order.findMany({
      where: { customerEmail: email },
      orderBy: { createdAt: "desc" },
    });
    const totalSpent = dbOrders.reduce((sum, ord) => sum + ord.total, 0);
    userPoints = Math.floor(totalSpent * 5);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Falls back to local NLP matching if API key is not configured
    const localReply = fallbackResponse(message, dbProducts, dbOrders, email || "", dbUser?.name || "Customer");
    res.status(200).json({
      success: true,
      data: localReply,
      source: "local-nlp",
    });
    return;
  }

  // Format context prompts for Gemini LLM model
  const productsContext = dbProducts.map(p => `- ${p.name} (ID: ${p.id}, Category: ${p.category}, Price: $${p.price.toFixed(2)}, Specs: ${p.description.substring(0, 100)}...)`).join("\n");
  const ordersContext = dbOrders.length > 0
    ? dbOrders.map(o => `- Order ${o.orderId}: Date: ${o.date}, Status: ${o.fulfillmentStatus}, Payment: ${o.paymentStatus}, Total: $${o.total.toFixed(2)}`).join("\n")
    : "No orders placed yet.";

  const systemPrompt = `You are "Aura Assistant", the official AI virtual helper for Aura Marketplace (an e-commerce storefront for premium accessories, clothing, and electronics).
Aura Marketplace policies & details:
- Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. Shipping can be tracked on the Orders Dashboard.
- Return/refund policy: Free 30-day returns and exchanges for items in original condition.
- Loyalty program: Aura Points scheme. Users earn 5 Aura Points for every $1 spent. Displayed on Dashboard Overview.
- Payment modes: Stripe (credit/debit card) and bKash (mobile banking).
- Support options: ticket inside Support Dashboard, email support@auramarketplace.com, phone +1 (555) 123-4567.
- Product reviews: customers can submit reviews (star ratings, comments, and OPTIONALLY upload image files) on their delivered items page.

Catalog context (Live products in store):
${productsContext}

User Context:
- Logged in User Name: ${dbUser?.name || "Guest"}
- Logged in User Email: ${email || "None"}
- Aura loyalty points balance: ${userPoints} points
- Order History (Live orders):
${ordersContext}

Please answer the user query professionally, helpfully and concisely. Keep answers under 3-4 sentences when possible. Use markdown links like [Dashboard](/dashboard) or [Collections](/collections) or [Orders](/dashboard/orders) if recommending pages.
User Query: "${message}"`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.candidates || result.candidates.length === 0) {
      throw new Error(result.error?.message || "Gemini API error response.");
    }

    const aiText = result.candidates[0].content.parts[0].text;
    res.status(200).json({
      success: true,
      data: aiText.trim(),
      source: "gemini-2.0-flash",
    });
  } catch (err: any) {
    console.error("Gemini API call failed, falling back to local NLP:", err);
    const localReply = fallbackResponse(message, dbProducts, dbOrders, email || "", dbUser?.name || "Customer");
    res.status(200).json({
      success: true,
      data: localReply,
      source: "local-nlp-fallback",
    });
  }
});

export const ChatbotController = {
  handleChat,
};
