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

export const sendSupportTicketEmail = async (
  ticket: any,
  user: any
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; font-family: Georgia, serif;">NEW SUPPORT TICKET SUBMITTED</h2>
      <p style="font-size: 14px; color: #555; font-weight: 600;">A new customer support ticket has been filed by a user on Aura Marketplace.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eee; width: 130px; color: #666;">Ticket ID:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #111;">${ticket.ticketId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eee; color: #666;">Customer Name:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eee; color: #111;">${user.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eee; color: #666;">Customer Email:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eee; color: #111;">${user.email}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eee; color: #666;">Subject:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #111;">${ticket.subject}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; color: #666; vertical-align: top;">Description:</td>
          <td style="padding: 10px 8px; background: #f9f9f9; border-radius: 8px; white-space: pre-wrap; color: #222; border: 1px solid #f0f0f0;">${ticket.description}</td>
        </tr>
      </table>
      
      <div style="margin-top: 30px; text-align: center;">
        <a href="http://localhost:3000/admin/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 13px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">Manage Tickets in Admin Panel</a>
      </div>
    </div>
  `;

  const transporter = getTransporter();
  const adminEmail = config.smtp.user || "admin@gmail.com";

  if (!transporter) {
    console.log("-----------------------------------------");
    console.log(`[SMTP Not Configured] Support Ticket Email:`);
    console.log(`To Admin: ${adminEmail}`);
    console.log(`Subject: [Ticket ${ticket.ticketId}] ${ticket.subject}`);
    console.log(`From: ${user.name} (${user.email})`);
    console.log("-----------------------------------------");
    return;
  }

  await transporter.sendMail({
    from: `Aura Support <${config.smtp.from}>`,
    to: adminEmail,
    subject: `[SUPPORT TICKET] ${ticket.ticketId} - ${ticket.subject}`,
    html,
  });
};
