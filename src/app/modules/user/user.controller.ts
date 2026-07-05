import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

// Helper to map backend role string to frontend role string
const mapRoleToFrontend = (role: string): "Admin" | "Customer" | "Seller" => {
  const normalized = role.toLowerCase();
  if (normalized === "admin") return "Admin";
  if (normalized === "seller") return "Seller";
  return "Customer";
};

// Helper to map frontend role string to backend role string
const mapRoleToBackend = (role: string): string => {
  const normalized = role.toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "seller") return "seller";
  return "user";
};

const createUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { name, email, role, status } = req.body;
  const errors: Record<string, string> = {};

  // Validations
  if (!name || name.trim() === "") {
    errors.name = "Full name is required.";
  }
  if (!email || email.trim() === "") {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please provide a valid email address.";
  }

  // Email uniqueness check
  if (email && email.trim() !== "") {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingUser) {
      errors.email = "Email address is already in use.";
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

  const backendRole = role ? mapRoleToBackend(role) : "user";
  const userStatus = status || "Active";

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: backendRole,
      status: userStatus,
      isVerified: userStatus === "Active",
    },
  });

  const responseData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRoleToFrontend(user.role),
    joinedDate: new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    lastLogin: user.status === "Active" ? "Active now" : "Never",
    status: user.status,
  };

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: responseData,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRoleToFrontend(user.role),
    joinedDate: new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    lastLogin: user.status === "Active" ? "Active now" : "Never",
    status: user.status,
  }));

  res.status(200).json({
    success: true,
    data: formattedUsers,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { name, email, role, status } = req.body;
  const errors: Record<string, string> = {};

  // Validations
  if (!name || name.trim() === "") {
    errors.name = "Full name is required.";
  }
  if (!email || email.trim() === "") {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please provide a valid email address.";
  }

  // Email uniqueness check (excluding current user)
  if (email && email.trim() !== "") {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        NOT: { id: id },
      },
    });
    if (existingUser) {
      errors.email = "Email address is already in use.";
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

  const backendRole = role ? mapRoleToBackend(role) : "user";
  const userStatus = status || "Active";

  const user = await prisma.user.update({
    where: { id: id },
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: backendRole,
      status: userStatus,
    },
  });

  const responseData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRoleToFrontend(user.role),
    joinedDate: new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    lastLogin: user.status === "Active" ? "Active now" : "Never",
    status: user.status,
  };

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: responseData,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await prisma.user.delete({
    where: { id: id },
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
};
