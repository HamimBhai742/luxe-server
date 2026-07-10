import type { Request, Response } from "express";
import bcryptjs from "bcryptjs";
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
  const { page = 1, limit = 10, search = "", role = "All" } = req.query;

  const parsedPage = Math.max(1, parseInt(page as string, 10));
  const parsedLimit = Math.max(1, parseInt(limit as string, 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const where: any = {};

  // Search filter
  if (search) {
    const term = String(search).trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  // Role filter
  if (role && role !== "All") {
    const backendRole = mapRoleToBackend(role as string);
    where.role = backendRole;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parsedLimit,
    }),
    prisma.user.count({ where }),
  ]);

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
    meta: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
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

const getMyProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  const responseData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRoleToFrontend(user.role),
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    bio: user.bio || "",
    location: user.location || "",
    username: user.username || "",
    website: user.website || "",
    twitter: user.twitter || "",
    workspaceStyle: user.workspaceStyle || "Minimalist / Dark",
  };

  res.status(200).json({
    success: true,
    data: responseData,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const { name, phone, avatarUrl, bio, location, username, website, twitter, workspaceStyle } = req.body;

  if (!name || name.trim() === "") {
    res.status(400).json({
      success: false,
      message: "Name is required.",
    });
    return;
  }

  if (username && username.trim() !== "") {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        NOT: { id: userId },
      },
    });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Username is already in use.",
      });
      return;
    }
  }

  let finalAvatarUrl = avatarUrl;
  if (avatarUrl && avatarUrl.startsWith("data:image/")) {
    try {
      if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
        const uploadResponse = await cloudinary.uploader.upload(avatarUrl, {
          folder: "luxe_profiles",
        });
        finalAvatarUrl = uploadResponse.secure_url;
      }
    } catch (err: any) {
      console.error("Profile avatar Cloudinary upload failed:", err);
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      avatarUrl: finalAvatarUrl ? finalAvatarUrl.trim() : null,
      bio: bio ? bio.trim() : null,
      location: location ? location.trim() : null,
      username: username ? username.trim() : null,
      website: website ? website.trim() : null,
      twitter: twitter ? twitter.trim() : null,
      workspaceStyle: workspaceStyle ? workspaceStyle.trim() : null,
    },
  });

  const responseData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRoleToFrontend(user.role),
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    bio: user.bio || "",
    location: user.location || "",
    username: user.username || "",
    website: user.website || "",
    twitter: user.twitter || "",
    workspaceStyle: user.workspaceStyle || "Minimalist / Dark",
  };

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: responseData,
  });
});

const changeMyPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      message: "Current password and new password are required.",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found.",
    });
    return;
  }

  if (!user.password) {
    res.status(400).json({
      success: false,
      message: "This account does not have a password configured (social login).",
    });
    return;
  }

  const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    res.status(400).json({
      success: false,
      message: "Incorrect current password.",
    });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long.",
    });
    return;
  }

  const hashedPassword = await bcryptjs.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
};
