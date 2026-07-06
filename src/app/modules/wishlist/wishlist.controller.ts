import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

const getWishlist = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    success: true,
    message: "Wishlist retrieved successfully",
    data: items.map((item) => item.product),
  });
});

const addWishlistItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const { productId } = req.body;

  if (!productId) {
    res.status(400).json({ success: false, message: "Product ID is required." });
    return;
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    res.status(404).json({ success: false, message: "Product not found." });
    return;
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    res.status(200).json({
      success: true,
      message: "Product is already in wishlist",
      data: product,
    });
    return;
  }

  await prisma.wishlistItem.create({
    data: {
      userId,
      productId,
    },
  });

  res.status(201).json({
    success: true,
    message: "Product added to wishlist successfully",
    data: product,
  });
});

const removeWishlistItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const { productId } = req.params as { productId: string };

  if (!productId) {
    res.status(400).json({ success: false, message: "Product ID is required." });
    return;
  }

  try {
    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  } catch (error) {
    // If not found, ignore error and report success
  }

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist successfully",
  });
});

export const WishlistController = {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
};
