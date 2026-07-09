import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

const createFaq = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { question, answer, category, order } = req.body;

  const errors: Record<string, string> = {};

  if (!question || question.trim() === "") {
    errors.question = "Question is required.";
  }
  if (!answer || answer.trim() === "") {
    errors.answer = "Answer is required.";
  }
  if (!category || category.trim() === "") {
    errors.category = "Category is required.";
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  const faq = await prisma.faq.create({
    data: {
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      order: order !== undefined ? parseInt(String(order)) : 0,
    },
  });

  res.status(201).json({
    success: true,
    message: "FAQ created successfully",
    data: faq,
  });
});

const getAllFaqs = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const faqs = await prisma.faq.findMany({
    orderBy: [
      { order: "asc" },
      { createdAt: "desc" }
    ],
  });

  res.status(200).json({
    success: true,
    data: faqs,
  });
});

const getSingleFaq = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const faq = await prisma.faq.findUnique({
    where: { id },
  });

  if (!faq) {
    res.status(404).json({
      success: false,
      message: "FAQ not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: faq,
  });
});

const updateFaq = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { question, answer, category, order } = req.body;

  const errors: Record<string, string> = {};

  if (!question || question.trim() === "") {
    errors.question = "Question is required.";
  }
  if (!answer || answer.trim() === "") {
    errors.answer = "Answer is required.";
  }
  if (!category || category.trim() === "") {
    errors.category = "Category is required.";
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  const existing = await prisma.faq.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      message: "FAQ not found",
    });
    return;
  }

  const faq = await prisma.faq.update({
    where: { id },
    data: {
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      order: order !== undefined ? parseInt(String(order)) : 0,
    },
  });

  res.status(200).json({
    success: true,
    message: "FAQ updated successfully",
    data: faq,
  });
});

const deleteFaq = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.faq.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      message: "FAQ not found",
    });
    return;
  }

  await prisma.faq.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "FAQ deleted successfully",
  });
});

export const FaqController = {
  createFaq,
  getAllFaqs,
  getSingleFaq,
  updateFaq,
  deleteFaq,
};
