import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";
import AppError from "../../utils/appError.js";

const getUserAddresses = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userEmail = (req as any).user.email;

  const addresses = await prisma.address.findMany({
    where: { userEmail },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    message: "Addresses retrieved successfully",
    data: addresses,
  });
});

const createAddress = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userEmail = (req as any).user.email;
  const { fullName, phone, addressLine1, addressLine2, city, state, zipCode, isDefault, addressType } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !zipCode) {
    throw new AppError("All fields except addressLine2 are required.", 400);
  }

  // Count user's existing addresses
  const existingCount = await prisma.address.count({
    where: { userEmail },
  });

  // If this is the first address, force it to be default
  const shouldBeDefault = existingCount === 0 ? true : !!isDefault;

  if (shouldBeDefault) {
    // Unset all other defaults
    await prisma.address.updateMany({
      where: { userEmail },
      data: { isDefault: false },
    });
  }

  const newAddress = await prisma.address.create({
    data: {
      userEmail,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : null,
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      isDefault: shouldBeDefault,
      addressType: addressType ? addressType.trim() : "Home",
    },
  });

  res.status(201).json({
    success: true,
    message: "Address created successfully",
    data: newAddress,
  });
});

const updateAddress = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userEmail = (req as any).user.email;
  const id = req.params.id as string;
  const { fullName, phone, addressLine1, addressLine2, city, state, zipCode, isDefault, addressType } = req.body;

  const address = await prisma.address.findUnique({
    where: { id },
  });

  if (!address || address.userEmail !== userEmail) {
    throw new AppError("Address not found or unauthorized", 404);
  }

  const shouldBeDefault = !!isDefault;

  if (shouldBeDefault) {
    // Unset all other defaults
    await prisma.address.updateMany({
      where: { userEmail },
      data: { isDefault: false },
    });
  }

  const updatedAddress = await prisma.address.update({
    where: { id },
    data: {
      fullName: fullName !== undefined ? fullName.trim() : address.fullName,
      phone: phone !== undefined ? phone.trim() : address.phone,
      addressLine1: addressLine1 !== undefined ? addressLine1.trim() : address.addressLine1,
      addressLine2: addressLine2 !== undefined ? (addressLine2 ? addressLine2.trim() : null) : address.addressLine2,
      city: city !== undefined ? city.trim() : address.city,
      state: state !== undefined ? state.trim() : address.state,
      zipCode: zipCode !== undefined ? zipCode.trim() : address.zipCode,
      isDefault: shouldBeDefault,
      addressType: addressType !== undefined ? addressType.trim() : address.addressType,
    },
  });

  // If default was turned off, make sure at least one default exists if they have addresses
  if (!shouldBeDefault && address.isDefault) {
    const remaining = await prisma.address.findFirst({
      where: { userEmail, NOT: { id } },
    });
    if (remaining) {
      await prisma.address.update({
        where: { id: remaining.id },
        data: { isDefault: true },
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    data: updatedAddress,
  });
});

const deleteAddress = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userEmail = (req as any).user.email;
  const id = req.params.id as string;

  const address = await prisma.address.findUnique({
    where: { id },
  });

  if (!address || address.userEmail !== userEmail) {
    throw new AppError("Address not found or unauthorized", 404);
  }

  await prisma.address.delete({
    where: { id },
  });

  // If the deleted address was default, set another address as default
  if (address.isDefault) {
    const remaining = await prisma.address.findFirst({
      where: { userEmail },
      orderBy: { createdAt: "desc" },
    });
    if (remaining) {
      await prisma.address.update({
        where: { id: remaining.id },
        data: { isDefault: true },
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
});

const setDefaultAddress = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userEmail = (req as any).user.email;
  const id = req.params.id as string;

  const address = await prisma.address.findUnique({
    where: { id },
  });

  if (!address || address.userEmail !== userEmail) {
    throw new AppError("Address not found or unauthorized", 404);
  }

  // Unset all other defaults
  await prisma.address.updateMany({
    where: { userEmail },
    data: { isDefault: false },
  });

  // Set this one as default
  const updatedAddress = await prisma.address.update({
    where: { id },
    data: { isDefault: true },
  });

  res.status(200).json({
    success: true,
    message: "Default address set successfully",
    data: updatedAddress,
  });
});

export const AddressController = {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
