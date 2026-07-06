import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

const createCoupon = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const {
    code,
    type,
    value,
    usageUsed,
    usageMax,
    expiryDate,
    status,
  } = req.body;

  const errors: Record<string, string> = {};

  // Validations
  if (!code || code.trim() === "") {
    errors.code = "Coupon code is required.";
  }
  if (!type || !["Percentage", "Fixed Amount", "Free Shipping"].includes(type)) {
    errors.type = "A valid discount type is required.";
  }
  if (type !== "Free Shipping" && (!value || value.trim() === "")) {
    errors.value = "Discount value is required.";
  }

  // Code uniqueness check
  if (code && code.trim() !== "") {
    const existingByCode = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existingByCode) {
      errors.code = "Coupon code already exists.";
    }
  }

  // Return validation errors if any
  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.trim().toUpperCase(),
      type,
      value: type === "Free Shipping" ? "Standard" : value.trim(),
      usageUsed: Number(usageUsed) || 0,
      usageMax: usageMax !== undefined ? Number(usageMax) : -1,
      expiryDate: expiryDate || "Never",
      status: status || "Active",
    },
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    data: coupon,
  });
});

const getAllCoupons = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    data: coupons,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const {
    code,
    type,
    value,
    usageUsed,
    usageMax,
    expiryDate,
    status,
  } = req.body;

  const errors: Record<string, string> = {};

  // Validations
  if (!code || code.trim() === "") {
    errors.code = "Coupon code is required.";
  }
  if (!type || !["Percentage", "Fixed Amount", "Free Shipping"].includes(type)) {
    errors.type = "A valid discount type is required.";
  }
  if (type !== "Free Shipping" && (!value || value.trim() === "")) {
    errors.value = "Discount value is required.";
  }

  // Code uniqueness check (excluding current coupon)
  if (code && code.trim() !== "") {
    const existingByCode = await prisma.coupon.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        NOT: { id: id },
      },
    });
    if (existingByCode) {
      errors.code = "Coupon code already exists.";
    }
  }

  // Return validation errors if any
  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  const updateData: Record<string, any> = {
    code: code.trim().toUpperCase(),
    type,
    value: type === "Free Shipping" ? "Standard" : value.trim(),
    expiryDate: expiryDate || "Never",
    status: status || "Active",
  };

  if (usageUsed !== undefined) {
    updateData.usageUsed = Number(usageUsed);
  }
  if (usageMax !== undefined) {
    updateData.usageMax = Number(usageMax);
  }

  const coupon = await prisma.coupon.update({
    where: { id: id },
    data: updateData,
  });

  res.status(200).json({
    success: true,
    message: "Coupon updated successfully",
    data: coupon,
  });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await prisma.coupon.delete({
    where: { id: id },
  });

  res.status(200).json({
    success: true,
    message: "Coupon deleted successfully",
  });
});

const validateCoupon = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;

  if (!code || code.trim() === "") {
    res.status(400).json({
      success: false,
      message: "Coupon code is required.",
    });
    return;
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon) {
    res.status(400).json({
      success: false,
      message: "Coupon code not found.",
    });
    return;
  }

  if (coupon.status !== "Active") {
    res.status(400).json({
      success: false,
      message: "Coupon code is inactive.",
    });
    return;
  }

  // Check usage thresholds
  if (coupon.usageMax !== -1 && coupon.usageUsed >= coupon.usageMax) {
    res.status(400).json({
      success: false,
      message: "Coupon code has reached its maximum usage limit.",
    });
    return;
  }

  // Check expiry
  if (coupon.expiryDate && coupon.expiryDate !== "Never") {
    const expiry = new Date(coupon.expiryDate);
    const now = new Date();
    if (expiry.getTime() < now.getTime()) {
      res.status(400).json({
        success: false,
        message: "Coupon code has expired.",
      });
      return;
    }
  }

  res.status(200).json({
    success: true,
    message: "Coupon applied successfully",
    data: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    },
  });
});

export const CouponController = {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
