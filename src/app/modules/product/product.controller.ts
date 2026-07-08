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
    images,
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
      images: images && Array.isArray(images) ? images.map((img: any) => String(img).trim()) : [image.trim()],
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
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = products.map((p) => {
    const ratingCount = p.reviews.length;
    const rating = ratingCount > 0
      ? parseFloat((p.reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount).toFixed(1))
      : 5.0;

    const { reviews, ...productData } = p;
    return {
      ...productData,
      rating,
      ratingCount,
    };
  });

  res.status(200).json({
    success: true,
    data,
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
    images,
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

  // 1. Fetch current product from db to compare images
  const currentProduct = await prisma.product.findUnique({
    where: { id: id },
  });
  if (!currentProduct) {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
    return;
  }

  // 2. Identify images to delete (present in current db entry, but not in new list)
  const oldImages: string[] = [];
  if (currentProduct.image) oldImages.push(currentProduct.image);
  if (currentProduct.images && Array.isArray(currentProduct.images)) {
    currentProduct.images.forEach((img: string) => {
      if (!oldImages.includes(img)) oldImages.push(img);
    });
  }

  const newImagesList: string[] = [];
  if (image) newImagesList.push(image.trim());
  if (images && Array.isArray(images)) {
    images.forEach((img: any) => {
      const cleanImg = String(img).trim();
      if (!newImagesList.includes(cleanImg)) newImagesList.push(cleanImg);
    });
  }

  const imagesToDelete = oldImages.filter(img => !newImagesList.includes(img));

  // 3. Delete replaced images from Cloudinary
  for (const imgUrl of imagesToDelete) {
    const publicId = getCloudinaryPublicId(imgUrl);
    if (publicId) {
      try {
        console.log(`Replacing/Removing image: Deleting "${publicId}" from Cloudinary...`);
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error(`Failed to delete replaced image "${publicId}" from Cloudinary:`, cloudinaryError);
      }
    }
  }

  // 4. Update Product in Database
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
      images: images && Array.isArray(images) ? images.map((img: any) => String(img).trim()) : [image.trim()],
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

const getSingleProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const product = await prisma.product.findUnique({
    where: { id: id },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!product) {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
    return;
  }

  const ratingCount = product.reviews.length;
  const rating = ratingCount > 0
    ? parseFloat((product.reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount).toFixed(1))
    : 5.0;

  res.status(200).json({
    success: true,
    data: {
      ...product,
      rating,
      ratingCount,
    },
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  // 1. Fetch product to see if there are images to delete from Cloudinary
  const product = await prisma.product.findUnique({
    where: { id: id },
  });

  if (product) {
    const allImages: string[] = [];
    if (product.image) allImages.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img: string) => {
        if (!allImages.includes(img)) allImages.push(img);
      });
    }

    for (const imgUrl of allImages) {
      const publicId = getCloudinaryPublicId(imgUrl);
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
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
