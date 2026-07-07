import nodemailer from "nodemailer";
import config from "../config/index.js";
import { getSignupOtpTemplate } from "./templates/signupOtp.js";
import { getForgotOtpTemplate } from "./templates/forgotOtp.js";
import { getOrderSuccessTemplate } from "./templates/orderSuccess.js";
import { getOrderFailedTemplate } from "./templates/orderFailed.js";
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
