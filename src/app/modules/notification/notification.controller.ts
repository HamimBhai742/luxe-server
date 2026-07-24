import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";

const getAllNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    data: notifications,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

const markSingleAsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await prisma.notification.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
});

const clearAllNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
  await prisma.notification.deleteMany({});

  res.status(200).json({
    success: true,
    message: "All notifications cleared successfully",
  });
});

export const NotificationController = {
  getAllNotifications,
  markAllAsRead,
  markSingleAsRead,
  deleteNotification,
  clearAllNotifications,
};
