import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";
import { sendSupportTicketEmail } from "../../utils/emailSender.js";

const createTicket = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const { subject, description } = req.body;

  if (!subject || !description) {
    res.status(400).json({ success: false, message: "Subject and description are required." });
    return;
  }

  const randNum = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `TCK-${randNum}`;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketId,
      subject,
      description,
      userId,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    sendSupportTicketEmail(ticket, user).catch((emailErr) => {
      console.error("Failed to send support ticket email to admin:", emailErr);
    });
  }

  res.status(201).json({
    success: true,
    message: "Ticket created successfully",
    data: ticket,
  });
});

const getTickets = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    message: "Tickets retrieved successfully",
    data: tickets,
  });
});

export const SupportController = {
  createTicket,
  getTickets,
};
