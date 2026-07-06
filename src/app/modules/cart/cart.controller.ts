import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

const getCart = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  res.status(200).json({
    success: true,
    message: "Cart retrieved successfully",
    data: items,
  });
});

const syncCart = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const { items, overwrite } = req.body;

  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (!item.productId) continue;

      // Ensure product exists
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;

      const existing = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: item.productId,
          },
        },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: overwrite ? (item.quantity || 1) : existing.quantity + (item.quantity || 1),
            specsText: item.specsText ?? existing.specsText,
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            userId,
            productId: item.productId,
            quantity: item.quantity || 1,
            specsText: item.specsText,
          },
        });
      }
    }
  }

  // Retrieve full updated cart after sync
  const updatedItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  res.status(200).json({
    success: true,
    message: "Cart synced successfully",
    data: updatedItems,
  });
});

const removeCartItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const { productId } = req.params as { productId: string };

  if (!productId) {
    res.status(400).json({ success: false, message: "Product ID is required." });
    return;
  }

  try {
    await prisma.cartItem.delete({
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
    message: "Cart item removed successfully",
  });
});

const clearCart = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;

  await prisma.cartItem.deleteMany({
    where: { userId },
  });

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
  });
});

export const CartController = {
  getCart,
  syncCart,
  removeCartItem,
  clearCart,
};
