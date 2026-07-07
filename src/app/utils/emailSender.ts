import nodemailer from "nodemailer";
import config from "../config/index.js";
import { getSignupOtpTemplate } from "./templates/signupOtp.js";
import { getForgotOtpTemplate } from "./templates/forgotOtp.js";
import { getOrderSuccessTemplate } from "./templates/orderSuccess.js";
import { getOrderFailedTemplate } from "./templates/orderFailed.js";
import { getOrderCancelledTemplate } from "./templates/orderCancelled.js";
import { getOrderStatusUpdateTemplate } from "./templates/orderStatusUpdate.js";
import { createInvoicePDF } from "./pdfGenerator.js";

const getTransporter = () => {
  if (!config.smtp.user || !config.smtp.pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
};

export const sendOTPEmail = async (
  email: string,
  name: string,
  otp: string,
  type: "verify" | "reset"
): Promise<void> => {
  const title = type === "verify" ? "Verify Your LUXE Account" : "Reset Your LUXE Password";
  const html = type === "verify"
    ? getSignupOtpTemplate(name, otp)
    : getForgotOtpTemplate(name, otp);

  const transporter = getTransporter();

  if (!transporter) {
    console.log("-----------------------------------------");
    console.log(`[SMTP Not Configured] Outputting OTP Email:`);
    console.log(`To: ${email}`);
    console.log(`Subject: ${title}`);
    console.log(`OTP Code: ${otp}`);
    console.log("-----------------------------------------");
    return;
  }

  await transporter.sendMail({
    from: `LUXE <${config.smtp.from}>`,
    to: email,
    subject: title,
    html,
  });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  order: any,
  invoiceNumber: string,
  paymentMethod: string,
  deliveryMethod: string,
  estimatedDelivery: string
): Promise<void> => {
  const html = getOrderSuccessTemplate(
    name,
    order,
    invoiceNumber,
    paymentMethod,
    deliveryMethod,
    estimatedDelivery
  );
  
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await createInvoicePDF(order, invoiceNumber);
  } catch (pdfErr) {
    console.error("Failed to generate PDF for attachment:", pdfErr);
  }

  const transporter = getTransporter();

  if (!transporter) {
    console.log("-----------------------------------------");
    console.log(`[SMTP Not Configured] Outputting Order Success Email:`);
    console.log(`To: ${email}`);
    console.log(`Subject: Order Confirmation - ${order.orderId}`);
    console.log(`Invoice: ${invoiceNumber}`);
    console.log(`Total: $${order.total}`);
    console.log("-----------------------------------------");
    return;
  }

  const attachments = pdfBuffer ? [
    {
      filename: `invoice-${invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    }
  ] : [];

  await transporter.sendMail({
    from: `LUXE <${config.smtp.from}>`,
    to: email,
    subject: `Order Confirmation - ${order.orderId}`,
    html,
    attachments,
  });
};

export const sendPaymentFailedEmail = async (
  email: string,
  name: string,
  amount: number,
  errorMessage: string
): Promise<void> => {
  const html = getOrderFailedTemplate(name, amount, errorMessage);
  const transporter = getTransporter();

  if (!transporter) {
    console.log("-----------------------------------------");
    console.log(`[SMTP Not Configured] Outputting Payment Failed Email:`);
    console.log(`To: ${email}`);
    console.log(`Subject: Payment Transaction Failed - LUXE`);
    console.log(`Amount: $${amount}`);
    console.log(`Error: ${errorMessage}`);
    console.log("-----------------------------------------");
    return;
  }

  await transporter.sendMail({
    from: `LUXE <${config.smtp.from}>`,
    to: email,
    subject: `Payment Transaction Failed - LUXE`,
    html,
  });
};

export const sendOrderCancellationEmails = async (
  order: any
): Promise<void> => {
  const customerEmail = order.customerEmail.trim();
  const customerName = order.customerName.trim();
  
  const customerHtml = getOrderCancelledTemplate(customerName, order, false);
  const adminHtml = getOrderCancelledTemplate(customerName, order, true);
  
  const transporter = getTransporter();
  const adminEmail = config.smtp.user || "admin@gmail.com";

  if (!transporter) {
    console.log("-----------------------------------------");
    console.log(`[SMTP Not Configured] Outputting Order Cancellation Emails:`);
    console.log(`To Customer: ${customerEmail}`);
    console.log(`To Admin: ${adminEmail}`);
    console.log(`Subject: Order Cancelled - ${order.orderId}`);
    console.log("-----------------------------------------");
    return;
  }

  // Send to Customer
  await transporter.sendMail({
    from: `LUXE <${config.smtp.from}>`,
    to: customerEmail,
    subject: `Order Cancelled - ${order.orderId}`,
    html: customerHtml,
  });

  // Send to Admin
  await transporter.sendMail({
    from: `LUXE <${config.smtp.from}>`,
    to: adminEmail,
    subject: `ALERT: Order Cancelled - ${order.orderId}`,
    html: adminHtml,
  });
};

export const sendOrderStatusUpdateEmail = async (
  order: any,
  status: string
): Promise<void> => {
  const email = order.customerEmail.trim();
  const name = order.customerName.trim();
  const html = getOrderStatusUpdateTemplate(name, order, status);
  const transporter = getTransporter();

  let subject = `Order Status Update - ${order.orderId}`;
  if (status === "Confirmed") {
    subject = `Order Confirmed - ${order.orderId}`;
  } else if (status === "Packed") {
    subject = `Order Packed - ${order.orderId}`;
  } else if (status === "Shipped") {
    subject = `Order Shipped - ${order.orderId}`;
  } else if (status === "Delivered") {
    subject = `Order Delivered - ${order.orderId}`;
  } else if (status === "Canceled" || status === "Cancelled") {
    subject = `Order Cancelled - ${order.orderId}`;
  } else if (status === "Returned") {
    subject = `Order Returned - ${order.orderId}`;
  }

  if (!transporter) {
    console.log("-----------------------------------------");
    console.log(`[SMTP Not Configured] Outputting Order Status Update Email:`);
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log("-----------------------------------------");
    return;
  }

  await transporter.sendMail({
    from: `LUXE <${config.smtp.from}>`,
    to: email,
    subject,
    html,
  });
};
