import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

const createCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    slug,
    parent,
    status,
    visibility,
    iconType,
  } = req.body;

  const errors: Record<string, string> = {};

  // Validations
  if (!name || name.trim() === "") {
    errors.name = "Category name is required.";
  }
  if (!slug || slug.trim() === "") {
    errors.slug = "Slug is required.";
  }

  // Name uniqueness check
  if (name && name.trim() !== "") {
    const existingByName = await prisma.category.findUnique({
      where: { name: name.trim() },
    });
    if (existingByName) {
      errors.name = "Category name already exists.";
    }
  }

  // Slug uniqueness check
  if (slug && slug.trim() !== "") {
    const existingBySlug = await prisma.category.findUnique({
      where: { slug: slug.trim() },
    });
    if (existingBySlug) {
      errors.slug = "Category slug already exists.";
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

  const webVisible = visibility ? !!visibility.web : true;
  const mobileVisible = visibility ? !!visibility.mobile : true;

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug: slug.trim(),
      parent: parent || "--",
      productsCount: 0,
      status: status || "Active",
      visWeb: webVisible,
      visMobile: mobileVisible,
      iconType: iconType || "other",
    },
  });

  // Map database response to match client expectations
  const responseData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent,
    productsCount: category.productsCount,
    status: category.status,
    visibility: {
      web: category.visWeb,
      mobile: category.visMobile,
    },
    iconType: category.iconType,
  };

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: responseData,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });

  const formattedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parent: cat.parent,
    productsCount: cat.productsCount,
    status: cat.status,
    visibility: {
      web: cat.visWeb,
      mobile: cat.visMobile,
    },
    iconType: cat.iconType,
  }));

  res.status(200).json({
    success: true,
    data: formattedCategories,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const {
    name,
    slug,
    parent,
    status,
    visibility,
    iconType,
  } = req.body;

  const errors: Record<string, string> = {};

  // Validations
  if (!name || name.trim() === "") {
    errors.name = "Category name is required.";
  }
  if (!slug || slug.trim() === "") {
    errors.slug = "Slug is required.";
  }

  // Name uniqueness check (excluding current category)
  if (name && name.trim() !== "") {
    const existingByName = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: id },
      },
    });
    if (existingByName) {
      errors.name = "Category name already exists.";
    }
  }

  // Slug uniqueness check (excluding current category)
  if (slug && slug.trim() !== "") {
    const existingBySlug = await prisma.category.findFirst({
      where: {
        slug: slug.trim(),
        NOT: { id: id },
      },
    });
    if (existingBySlug) {
      errors.slug = "Category slug already exists.";
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

  const webVisible = visibility ? !!visibility.web : true;
  const mobileVisible = visibility ? !!visibility.mobile : true;

  const category = await prisma.category.update({
    where: { id: id },
    data: {
      name: name.trim(),
      slug: slug.trim(),
      parent: parent || "--",
      status: status || "Active",
      visWeb: webVisible,
      visMobile: mobileVisible,
      iconType: iconType || "other",
    },
  });

  const responseData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent,
    productsCount: category.productsCount,
    status: category.status,
    visibility: {
      web: category.visWeb,
      mobile: category.visMobile,
    },
    iconType: category.iconType,
  };

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: responseData,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await prisma.category.delete({
    where: { id: id },
  });

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
