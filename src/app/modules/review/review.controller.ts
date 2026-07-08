import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";
import AppError from "../../utils/appError.js";

// Check if a user is eligible to write a review for a product
const checkEligibility = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const productId = req.params.productId as string;

  if (!user) {
    res.status(200).json({
      success: true,
      eligible: false,
      message: "Please log in to review this product.",
    });
    return;
  }

  // 1. Verify if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // 2. Check if the user has already reviewed the product
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
  });

  if (existingReview) {
    res.status(200).json({
      success: true,
      eligible: false,
      message: "You have already reviewed this product.",
    });
    return;
  }

  // 3. Check if user has an order with this product that is Delivered
  const orders = await prisma.order.findMany({
    where: {
      customerEmail: user.email,
      fulfillmentStatus: "Delivered",
    },
  });

  let hasPurchased = false;
  for (const order of orders) {
    const items = order.items
      ? typeof order.items === "string"
        ? JSON.parse(order.items)
        : (order.items as any[])
      : [];
    if (items.some((item: any) => String(item.id || item.productId) === String(productId))) {
      hasPurchased = true;
      break;
    }
  }

  if (!hasPurchased) {
    res.status(200).json({
      success: true,
      eligible: false,
      message: "You can only review products that have been delivered to you.",
    });
    return;
  }

  res.status(200).json({
    success: true,
    eligible: true,
  });
});

// Submit a new review
const submitReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const { productId, rating, comment, images } = req.body;

  if (!productId || productId.trim() === "") {
    throw new AppError("Product ID is required.", 400);
  }

  const parsedRating = parseInt(String(rating), 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new AppError("Rating must be an integer between 1 and 5.", 400);
  }

  if (!comment || comment.trim() === "") {
    throw new AppError("Comment is required.", 400);
  }

  // 1. Verify if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found.", 404);
  }

  // 2. Check duplicate review
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
  });

  if (existingReview) {
    throw new AppError("You have already reviewed this product.", 400);
  }

  // 3. Check purchase & delivery status
  const orders = await prisma.order.findMany({
    where: {
      customerEmail: user.email,
      fulfillmentStatus: "Delivered",
    },
  });

  let hasPurchased = false;
  for (const order of orders) {
    const items = order.items
      ? typeof order.items === "string"
        ? JSON.parse(order.items)
        : (order.items as any[])
      : [];
    if (items.some((item: any) => String(item.id || item.productId) === String(productId))) {
      hasPurchased = true;
      break;
    }
  }

  if (!hasPurchased) {
    throw new AppError("You can only review products that have been delivered to you.", 403);
  }

  // 4. Create Review
  const review = await prisma.review.create({
    data: {
      rating: parsedRating,
      comment: comment.trim(),
      userId: user.id,
      productId,
      images: images || [],
    },
  });

  res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    data: review,
  });
});

// Get all reviews written by the logged-in user
const getUserReviews = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;

  if (!user) {
    throw new AppError("Unauthorized access.", 401);
  }

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    select: {
      productId: true,
      rating: true,
      comment: true,
      images: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    data: reviews,
  });
});

export const ReviewController = {
  checkEligibility,
  submitReview,
  getUserReviews,
};
