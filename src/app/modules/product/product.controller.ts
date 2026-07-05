import type { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import config from "../../config/index.js";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const createProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    category,
    sku,
    barcode,
    inventoryType,
    inventoryCount,
    price,
    originalPrice,
    status,
    image,
    description,
    brand,
  } = req.body;

  const errors: Record<string, string> = {};

  // Form Validations
  if (!name || name.trim() === "") {
    errors.name = "Product name is required.";
  }
  if (!description || description.trim() === "") {
    errors.description = "Product description is required.";
  }
  if (!category || category.trim() === "") {
    errors.category = "Category is required.";
  }
  if (!sku || sku.trim() === "") {
    errors.sku = "SKU code is required.";
  }

  // Price checks
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.price = "Price must be a positive number.";
  }

  // Original price checks
  let parsedOriginalPrice: number | null = null;
  if (originalPrice !== undefined && originalPrice !== null && originalPrice !== "") {
    parsedOriginalPrice = parseFloat(originalPrice);
    if (isNaN(parsedOriginalPrice) || parsedOriginalPrice <= 0) {
      errors.originalPrice = "Compare-at price must be a positive number.";
    }
  }

  // Inventory validation
  let parsedInventoryCount = 0;
  if (inventoryType === "tracked") {
    parsedInventoryCount = parseInt(inventoryCount, 10);
    if (isNaN(parsedInventoryCount) || parsedInventoryCount < 0) {
      errors.inventoryCount = "Inventory count must be a non-negative integer.";
    }
  }

  // Image validation
  if (!image || image.trim() === "") {
    errors.image = "Product image is required.";
  }

  // SKU Uniqueness check
  if (sku && sku.trim() !== "") {
    const existingProduct = await prisma.product.findUnique({
      where: { sku: sku.trim() },
    });
    if (existingProduct) {
      errors.sku = "A product with this SKU already exists.";
    }
  }

  // Return validation error response if any
  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // Create Product in Database
  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      category: category.trim(),
      sku: sku.trim(),
      barcode: barcode ? barcode.trim() : null,
      inventoryType: inventoryType === "untracked" ? "untracked" : "tracked",
      inventoryCount: inventoryType === "untracked" ? 0 : parsedInventoryCount,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      status: status || "Published",
      image: image.trim(),
      description: description.trim(),
      brand: brand ? brand.trim() : null,
    },
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    data: products,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const {
    name,
    category,
    sku,
    barcode,
    inventoryType,
    inventoryCount,
    price,
    originalPrice,
    status,
    image,
    description,
    brand,
  } = req.body;

  const errors: Record<string, string> = {};

  // Form Validations
  if (!name || name.trim() === "") {
    errors.name = "Product name is required.";
  }
  if (!description || description.trim() === "") {
    errors.description = "Product description is required.";
  }
  if (!category || category.trim() === "") {
    errors.category = "Category is required.";
  }
  if (!sku || sku.trim() === "") {
    errors.sku = "SKU code is required.";
  }

  // Price checks
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.price = "Price must be a positive number.";
  }

  // Original price checks
  let parsedOriginalPrice: number | null = null;
  if (originalPrice !== undefined && originalPrice !== null && originalPrice !== "") {
    parsedOriginalPrice = parseFloat(originalPrice);
    if (isNaN(parsedOriginalPrice) || parsedOriginalPrice <= 0) {
      errors.originalPrice = "Compare-at price must be a positive number.";
    }
  }

  // Inventory validation
  let parsedInventoryCount = 0;
  if (inventoryType === "tracked") {
    parsedInventoryCount = parseInt(inventoryCount, 10);
    if (isNaN(parsedInventoryCount) || parsedInventoryCount < 0) {
      errors.inventoryCount = "Inventory count must be a non-negative integer.";
    }
  }

  // Image validation
  if (!image || image.trim() === "") {
    errors.image = "Product image is required.";
  }

  // SKU Uniqueness check (excluding current product)
  if (sku && sku.trim() !== "") {
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: sku.trim(),
        NOT: { id: id },
      },
    });
    if (existingProduct) {
      errors.sku = "A product with this SKU already exists.";
    }
  }

  // Return validation error response if any
  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // Update Product in Database
  const product = await prisma.product.update({
    where: { id: id },
    data: {
      name: name.trim(),
      category: category.trim(),
      sku: sku.trim(),
      barcode: barcode ? barcode.trim() : null,
      inventoryType: inventoryType === "untracked" ? "untracked" : "tracked",
      inventoryCount: inventoryType === "untracked" ? 0 : parsedInventoryCount,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      status: status || "Published",
      image: image.trim(),
      description: description.trim(),
      brand: brand ? brand.trim() : null,
    },
  });

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

const getCloudinaryPublicId = (imageUrl: string): string | null => {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) {
    return null;
  }
  const parts = imageUrl.split("/image/upload/");
  if (parts.length < 2) return null;
  
  const publicIdWithExtension = parts[1];
  if (!publicIdWithExtension) return null;
  
  let cleanPublicId = publicIdWithExtension;
  const versionMatch = publicIdWithExtension.match(/^v\d+\/(.+)$/);
  if (versionMatch && versionMatch[1]) {
    cleanPublicId = versionMatch[1];
  }
  return cleanPublicId.replace(/\.[^/.]+$/, "");
};

const deleteProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  // 1. Fetch product to see if there is an image to delete from Cloudinary
  const product = await prisma.product.findUnique({
    where: { id: id },
  });

  if (product && product.image) {
    const publicId = getCloudinaryPublicId(product.image);
    if (publicId) {
      try {
        console.log(`Deleting image "${publicId}" from Cloudinary...`);
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        // Log error but don't block product deletion if Cloudinary fails
        console.error("Failed to delete image from Cloudinary:", cloudinaryError);
      }
    }
  }

  // 2. Delete product from database
  await prisma.product.delete({
    where: { id: id },
  });

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const ProductController = {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
};
