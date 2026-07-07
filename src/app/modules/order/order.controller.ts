import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";
import { createInvoicePDF } from "../../utils/pdfGenerator.js";
import { sendOrderConfirmationEmail } from "../../utils/emailSender.js";

const createOrder = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const {
    customerName,
    customerEmail,
    total,
    paymentStatus,
    fulfillmentStatus,
    items,
    paymentMethod,
    deliveryMethod,
    estimatedDelivery,
  } = req.body;

  const errors: Record<string, string> = {};

  // Validations
  if (!customerName || customerName.trim() === "") {
    errors.customerName = "Customer name is required.";
  }
  if (!customerEmail || customerEmail.trim() === "") {
    errors.customerEmail = "Customer email is required.";
  }
  const parsedTotal = parseFloat(total);
  if (isNaN(parsedTotal) || parsedTotal < 0) {
    errors.total = "Total must be a non-negative number.";
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

  // Generate a random order number
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const orderId = `#AUR-${randomId}`;

  // Formatted date string to match client presentation
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const order = await prisma.order.create({
    data: {
      orderId,
      date: formattedDate,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      total: parsedTotal,
      paymentStatus: paymentStatus || "Pending",
      fulfillmentStatus: fulfillmentStatus || "Processing",
      items: items || null,
    },
  });

  // Generate Invoice (Paid for Stripe/bKash, Unpaid for COD)
  const randomInv = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `#INV-${randomInv}`;

  await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: order.id,
      amount: parsedTotal,
      status: paymentStatus === "Paid" ? "Paid" : "Unpaid",
    },
  });

  // Log transaction for bKash if not already logged (Stripe logs during payment intent creation)
  if (paymentStatus === "Paid" && paymentMethod === "bkash") {
    await prisma.transaction.create({
      data: {
        transactionId: `#TRX-${Math.floor(10000 + Math.random() * 90000)}`,
        date: formattedDate,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        amount: parsedTotal,
        status: "Succeeded",
        method: "bKash",
      },
    });
  }

  // Send confirmation email asynchronously (do not block client response)
  sendOrderConfirmationEmail(
    customerEmail.trim(),
    customerName.trim(),
    order,
    invoiceNumber,
    paymentMethod || "Stripe (Card)",
    deliveryMethod || "standard",
    estimatedDelivery || "3-5 Days"
  ).catch((mailErr) => {
    console.error("Failed to send order confirmation email:", mailErr);
  });

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: order,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, search = "", status = "All", payment = "All", dateRange = "All" } = req.query;

  const parsedPage = Math.max(1, parseInt(page as string, 10));
  const parsedLimit = Math.max(1, parseInt(limit as string, 10));

  // Auto seed orders if table is empty
  const count = await prisma.order.count();
  if (count === 0 && !search && status === "All" && payment === "All" && dateRange === "All") {
    // Seed default orders to keep UI populated on first load
    const defaultOrders = [
      {
        orderId: "#AUR-9921",
        date: "Oct 24, 2024",
        customerName: "Alex Thompson",
        customerEmail: "alex.t@example.com",
        total: 249.0,
        paymentStatus: "Paid",
        fulfillmentStatus: "Shipped",
        createdAt: new Date("2024-10-24T12:00:00Z")
      },
      {
        orderId: "#AUR-9920",
        date: "Oct 23, 2024",
        customerName: "Sarah Jenkins",
        customerEmail: "s.jenkins@provider.net",
        total: 1120.5,
        paymentStatus: "Pending",
        fulfillmentStatus: "Processing",
        createdAt: new Date("2024-10-23T12:00:00Z")
      },
      {
        orderId: "#AUR-9919",
        date: "Oct 22, 2024",
        customerName: "Michael Chen",
        customerEmail: "m.chen@example.com",
        total: 85.0,
        paymentStatus: "Paid",
        fulfillmentStatus: "Delivered",
        createdAt: new Date("2024-10-22T12:00:00Z")
      },
      {
        orderId: "#AUR-9918",
        date: "Oct 21, 2024",
        customerName: "Emily Davis",
        customerEmail: "emily.d@provider.net",
        total: 430.0,
        paymentStatus: "Paid",
        fulfillmentStatus: "Canceled",
        createdAt: new Date("2024-10-21T12:00:00Z")
      },
      {
        orderId: "#AUR-9917",
        date: "Oct 20, 2024",
        customerName: "James Wilson",
        customerEmail: "j.wilson@tech.com",
        total: 150.0,
        paymentStatus: "Refunded",
        fulfillmentStatus: "Returned",
        createdAt: new Date("2024-10-20T12:00:00Z")
      }
    ];

    await prisma.order.createMany({
      data: defaultOrders
    });
  }

  const where: any = {};

  // Search filter
  if (search) {
    const searchString = String(search).trim();
    where.OR = [
      { orderId: { contains: searchString, mode: "insensitive" } },
      { customerName: { contains: searchString, mode: "insensitive" } },
      { customerEmail: { contains: searchString, mode: "insensitive" } },
    ];
  }

  // Fulfillment status filter
  if (status !== "All") {
    where.fulfillmentStatus = status;
  }

  // Payment status filter
  if (payment !== "All") {
    where.paymentStatus = payment;
  }

  // Date range filter
  if (dateRange !== "All") {
    const now = new Date();
    if (dateRange === "Today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: todayStart };
    } else if (dateRange === "Yesterday") {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: yesterdayStart, lt: yesterdayEnd };
    } else if (dateRange === "7d") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: sevenDaysAgo };
    } else if (dateRange === "30d") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: thirtyDaysAgo };
    }
  }

  const totalCount = await prisma.order.count({ where });
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (parsedPage - 1) * parsedLimit,
    take: parsedLimit,
  });

  res.status(200).json({
    success: true,
    data: orders,
    meta: {
      total: totalCount,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalCount / parsedLimit),
    }
  });
});

const updateOrder = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const {
    customerName,
    customerEmail,
    total,
    paymentStatus,
    fulfillmentStatus,
  } = req.body;

  const errors: Record<string, string> = {};

  // Validations
  if (!customerName || customerName.trim() === "") {
    errors.customerName = "Customer name is required.";
  }
  if (!customerEmail || customerEmail.trim() === "") {
    errors.customerEmail = "Customer email is required.";
  }
  const parsedTotal = parseFloat(total);
  if (isNaN(parsedTotal) || parsedTotal < 0) {
    errors.total = "Total must be a non-negative number.";
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

  const updateData: Record<string, any> = {
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim(),
    total: parsedTotal,
    paymentStatus: paymentStatus || "Pending",
    fulfillmentStatus: fulfillmentStatus || "Processing",
  };

  const order = await prisma.order.update({
    where: { id: id },
    data: updateData,
  });

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
    data: order,
  });
});

const deleteOrder = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await prisma.order.delete({
    where: { id: id },
  });

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

const downloadInvoice = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: id as string },
    include: {
      invoice: true,
    },
  });

  if (!order) {
    res.status(404).json({
      success: false,
      message: "Order not found",
    });
    return;
  }

  let invoice = (order as any).invoice;
  if (!invoice) {
    // Generate Invoice dynamically if not exists
    const randomInv = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `#INV-${randomInv}`;
    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        amount: order.total,
        status: order.paymentStatus === "Paid" ? "Paid" : "Unpaid",
      },
    });
  }

  const pdfBuffer = await createInvoicePDF(order, invoice.invoiceNumber);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
  res.send(pdfBuffer);
});

export const OrderController = {
  createOrder,
  getAllOrders,
  updateOrder,
  deleteOrder,
  downloadInvoice,
};
