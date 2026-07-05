import type { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import config from "../../config/index.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadImage = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { image } = req.body; // Expect base64 data URL string

  if (!image) {
    throw new AppError("No image data provided.", 400);
  }

  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    throw new AppError("Cloudinary is not configured on the server. Please check environment variables.", 500);
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "luxe_ecommerce",
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: uploadResponse.secure_url,
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw new AppError(error.message || "Failed to upload image to Cloudinary", 500);
  }
});

export const UploadController = {
  uploadImage,
};
