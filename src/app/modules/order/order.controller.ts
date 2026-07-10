import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import prisma from "../../db/prisma.js";
import { createInvoicePDF } from "../../utils/pdfGenerator.js";
import { sendOrderConfirmationEmail, sendOrderCancellationEmails, sendOrderStatusUpdateEmail } from "../../utils/emailSender.js";

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
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    couponCode,
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

  // Verify coupon is not used multiple times by this user
  if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "") {
    const codeUpper = couponCode.trim().toUpperCase();
    const existingOrderWithCoupon = await prisma.order.findFirst({
      where: {
        customerEmail: customerEmail.trim(),
        couponCode: codeUpper,
      },
    });

    if (existingOrderWithCoupon) {
      errors.coupon = "You have already redeemed this coupon.";
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

  // Generate sequential order number based on total count of existing orders
  const orderCount = await prisma.order.count();
  const nextOrderNum = (orderCount + 1).toString().padStart(3, "0");
  const orderId = `ORD-${nextOrderNum}`;

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
      paymentMethod: paymentMethod || "card",
      fulfillmentStatus: fulfillmentStatus || "Processing",
      items: items || null,
      phone: phone || null,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      couponCode: couponCode || null,
    },
  });

  // Generate sequential invoice number based on total count of existing invoices
  const invoiceCount = await prisma.invoice.count();
  const nextInvNum = (invoiceCount + 1).toString().padStart(3, "0");
  const invoiceNumber = `INV-${nextInvNum}`;

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

  // Increment coupon usage if coupon code was used
  if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "") {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });
      if (coupon) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: {
            usageUsed: {
              increment: 1,
            },
          },
        });
      }
    } catch (err) {
      console.error("Failed to update coupon usage count:", err);
    }
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
        orderId: "ORD-001",
        date: "Oct 24, 2024",
        customerName: "Alex Thompson",
        customerEmail: "alex.t@example.com",
        total: 249.0,
        paymentStatus: "Paid",
        fulfillmentStatus: "Shipped",
        createdAt: new Date("2024-10-24T12:00:00Z")
      },
      {
        orderId: "ORD-002",
        date: "Oct 23, 2024",
        customerName: "Sarah Jenkins",
        customerEmail: "s.jenkins@provider.net",
        total: 1120.5,
        paymentStatus: "Pending",
        fulfillmentStatus: "Processing",
        createdAt: new Date("2024-10-23T12:00:00Z")
      },
      {
        orderId: "ORD-003",
        date: "Oct 22, 2024",
        customerName: "Michael Chen",
        customerEmail: "m.chen@example.com",
        total: 85.0,
        paymentStatus: "Paid",
        fulfillmentStatus: "Delivered",
        createdAt: new Date("2024-10-22T12:00:00Z")
      },
      {
        orderId: "ORD-004",
        date: "Oct 21, 2024",
        customerName: "Emily Davis",
        customerEmail: "emily.d@provider.net",
        total: 430.0,
        paymentStatus: "Paid",
        fulfillmentStatus: "Canceled",
        createdAt: new Date("2024-10-21T12:00:00Z")
      },
      {
        orderId: "ORD-005",
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
    paymentMethod,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
  } = req.body;

  // Retrieve the existing order first
  const existingOrder = await prisma.order.findUnique({
    where: { id: id },
  });

  if (!existingOrder) {
    res.status(404).json({
      success: false,
      message: "Order not found",
    });
    return;
  }

  const errors: Record<string, string> = {};

  // Validations (only if provided, or fallback to existing values)
  const nameToSave = customerName !== undefined ? customerName : existingOrder.customerName;
  const emailToSave = customerEmail !== undefined ? customerEmail : existingOrder.customerEmail;
  const totalToSave = total !== undefined ? parseFloat(total) : existingOrder.total;

  if (!nameToSave || nameToSave.trim() === "") {
    errors.customerName = "Customer name is required.";
  }
  if (!emailToSave || emailToSave.trim() === "") {
    errors.customerEmail = "Customer email is required.";
  }
  if (isNaN(totalToSave) || totalToSave < 0) {
    errors.total = "Total must be a non-negative number.";
  }

  // Sequential order status transition state machine validation
  if (fulfillmentStatus !== undefined && fulfillmentStatus !== existingOrder.fulfillmentStatus) {
    const current = existingOrder.fulfillmentStatus;
    const target = fulfillmentStatus;

    if (current === "Canceled") {
      errors.fulfillmentStatus = "Order is already cancelled and cannot be updated.";
    } else if (current === "Returned") {
      errors.fulfillmentStatus = "Order is already returned and cannot be updated.";
    } else if (current === "Delivered") {
      if (target !== "Returned") {
        errors.fulfillmentStatus = "Delivered orders can only transition to Returned status.";
      }
    } else if (current === "Shipped") {
      if (target !== "Delivered") {
        errors.fulfillmentStatus = "Shipped orders can only transition to Delivered status.";
      }
    } else if (current === "Packed") {
      if (target !== "Shipped" && target !== "Canceled") {
        errors.fulfillmentStatus = "Packed orders can only transition to Shipped or Canceled status.";
      }
    } else if (current === "Confirmed") {
      if (target !== "Packed" && target !== "Canceled") {
        errors.fulfillmentStatus = "Confirmed orders can only transition to Packed or Canceled status.";
      }
    } else if (current === "Processing") {
      if (target !== "Confirmed" && target !== "Canceled") {
        errors.fulfillmentStatus = "Processing orders can only transition to Confirmed or Canceled status.";
      }
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

  const updateData: Record<string, any> = {
    customerName: nameToSave.trim(),
    customerEmail: emailToSave.trim(),
    total: totalToSave,
    paymentStatus: paymentStatus !== undefined ? paymentStatus : existingOrder.paymentStatus,
    paymentMethod: paymentMethod !== undefined ? paymentMethod : existingOrder.paymentMethod,
    fulfillmentStatus: fulfillmentStatus !== undefined ? fulfillmentStatus : existingOrder.fulfillmentStatus,
    phone: phone !== undefined ? phone : existingOrder.phone,
    addressLine1: addressLine1 !== undefined ? addressLine1 : existingOrder.addressLine1,
    addressLine2: addressLine2 !== undefined ? addressLine2 : existingOrder.addressLine2,
    city: city !== undefined ? city : existingOrder.city,
    state: state !== undefined ? state : existingOrder.state,
    zipCode: zipCode !== undefined ? zipCode : existingOrder.zipCode,
  };

  const updatedOrder = await prisma.order.update({
    where: { id: id },
    data: updateData,
  });

  // Check if status has changed
  if (fulfillmentStatus && fulfillmentStatus !== existingOrder.fulfillmentStatus) {
    if (fulfillmentStatus === "Canceled") {
      sendOrderCancellationEmails(updatedOrder).catch((mailErr) => {
        console.error("Failed to send order cancellation emails:", mailErr);
      });
    } else {
      sendOrderStatusUpdateEmail(updatedOrder, fulfillmentStatus).catch((mailErr) => {
        console.error("Failed to send order status update email:", mailErr);
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
    data: updatedOrder,
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
    // Generate sequential invoice number dynamically if not exists
    const invoiceCount = await prisma.invoice.count();
    const nextInvNum = (invoiceCount + 1).toString().padStart(3, "0");
    const invoiceNumber = `INV-${nextInvNum}`;
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
