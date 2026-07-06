import type { Request, Response } from "express";
import Stripe from "stripe";
import catchAsync from "../../utils/catchAsync.js";

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

    res.status(200).json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || "Failed to create payment intent with Stripe",
    });
  }
});

export const PaymentController = {
  createPaymentIntent,
};
