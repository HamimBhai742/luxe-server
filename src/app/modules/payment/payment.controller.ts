import type { Request, Response } from "express";
import Stripe from "stripe";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";
import { sendPaymentFailedEmail } from "../../utils/emailSender.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");

const createPaymentIntent = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { amount, email, name, phone, address } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({
      success: false,
      message: "A valid amount is required to create a payment intent.",
    });
    return;
  }

  // Convert dollars to cents (Stripe expects integer in cents)
  const amountInCents = Math.round(Number(amount) * 100);

  try {
    const paymentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: "usd",
      payment_method: "pm_card_visa",
      confirm: true,
      description: `Aura Marketplace Order for ${name || "Customer"}`,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    };

    if (email) {
      paymentParams.receipt_email = email;
    }

    if (name && address) {
      paymentParams.shipping = {
        name,
        phone: phone || undefined,
        address: {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country || "BD",
        },
      };
    }

    paymentParams.metadata = {
      customer_name: name || "",
      customer_email: email || "",
      customer_phone: phone || "",
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentParams);

    // Log successful transaction
    await prisma.transaction.create({
      data: {
        transactionId: `#TRX-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        customerName: name || "Customer",
        customerEmail: email || "guest@luxe.com",
        amount: Number(amount),
        status: "Succeeded",
        method: "Stripe",
      }
    });

    res.status(200).json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (err: any) {
    // Log failed transaction
    try {
      await prisma.transaction.create({
        data: {
          transactionId: `#TRX-${Math.floor(10000 + Math.random() * 90000)}`,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          customerName: name || "Customer",
          customerEmail: email || "guest@luxe.com",
          amount: Number(amount),
          status: "Failed",
          method: "Stripe",
        }
      });

      // Send payment failed email
      if (email) {
        await sendPaymentFailedEmail(
          email,
          name || "Customer",
          Number(amount),
          err?.message || "Payment intent creation or authorization failed"
        );
      }
    } catch (logErr) {
      console.error("Failed to log failed transaction or send email:", logErr);
    }

    res.status(500).json({
      success: false,
      message: err?.message || "Failed to create payment intent with Stripe",
    });
  }
});

export const PaymentController = {
  createPaymentIntent,
};
