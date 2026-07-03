import nodemailer from "nodemailer";
import config from "../config/index.js";
import { getSignupOtpTemplate } from "./templates/signupOtp.js";
import { getForgotOtpTemplate } from "./templates/forgotOtp.js";

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
