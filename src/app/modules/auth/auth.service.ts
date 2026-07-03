import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../db/prisma.js";
import config from "../../config/index.js";
import AppError from "../../utils/appError.js";
import { sendOTPEmail } from "../../utils/emailSender.js";
import type {
  TSignUpInput,
  TVerifyAccountInput,
  TLoginInput,
  TForgotPasswordInput,
  TVerifyOtpInput,
  TResetPasswordInput,
} from "./auth.interface.js";

// Helper to generate JWT token
const createToken = (userId: string, email: string): string => {
  return jwt.sign(
    { id: userId, email },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn as any }
  );
};

// Helper to generate 6-digit numeric OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const signup = async (payload: TSignUpInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError("Email is already registered and verified.", 400);
    }
    // If the user registered before but didn't verify, we overwrite/update their details and send a new OTP
  }

  const hashedPassword = await bcryptjs.hash(payload.password, 10);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes expiry

  let user;
  if (existingUser) {
    user = await prisma.user.update({
      where: { email: payload.email },
      data: {
        name: payload.name,
        password: hashedPassword,
        otp,
        otpExpiry,
        isVerified: false,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        otp,
        otpExpiry,
        isVerified: false,
      },
    });
  }

  // Send registration OTP email
  await sendOTPEmail(user.email, user.name, otp, "verify");

  return {
    message: "Registration initiated. Verification OTP code sent to your email.",
  };
};

const verifyAccount = async (payload: TVerifyAccountInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.isVerified) {
    throw new AppError("Account is already verified.", 400);
  }

  if (!user.otp || !user.otpExpiry || user.otp !== payload.otp) {
    throw new AppError("Invalid verification code.", 400);
  }

  if (user.otpExpiry < new Date()) {
    throw new AppError("Verification code has expired.", 400);
  }

  // Activate user account
  const activatedUser = await prisma.user.update({
    where: { email: payload.email },
    data: {
      isVerified: true,
      otp: null,
      otpExpiry: null,
    },
  });

  const accessToken = createToken(activatedUser.id, activatedUser.email);

  return {
    message: "Account verified successfully.",
    accessToken,
    user: {
      id: activatedUser.id,
      name: activatedUser.name,
      email: activatedUser.email,
    },
  };
};

const login = async (payload: TLoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password.", 400);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email address first before logging in.", 403);
  }

  const isPasswordValid = await bcryptjs.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 400);
  }

  const accessToken = createToken(user.id, user.email);

  return {
    message: "Login successful.",
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

const forgotPassword = async (payload: TForgotPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError("User not found with this email.", 404);
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes expiry

  await prisma.user.update({
    where: { email: payload.email },
    data: {
      otp,
      otpExpiry,
    },
  });

  // Send password reset OTP email
  await sendOTPEmail(user.email, user.name, otp, "reset");

  return {
    message: "Password reset OTP code sent to your email.",
  };
};

const verifyOtp = async (payload: TVerifyOtpInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.otp || !user.otpExpiry || user.otp !== payload.otp) {
    throw new AppError("Invalid verification code.", 400);
  }

  if (user.otpExpiry < new Date()) {
    throw new AppError("Verification code has expired.", 400);
  }

  // Generate a secure random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Save the reset token to the user record, overwriting the numeric OTP
  await prisma.user.update({
    where: { email: payload.email },
    data: {
      otp: resetToken,
      otpExpiry: tokenExpiry,
    },
  });

  return {
    message: "OTP code verified successfully. You can now reset your password.",
    token: resetToken,
  };
};

const resetPassword = async (payload: TResetPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const verificationCode = payload.token || payload.otp;

  if (!verificationCode || !user.otp || !user.otpExpiry || user.otp !== verificationCode) {
    throw new AppError("Invalid verification code.", 400);
  }

  if (user.otpExpiry < new Date()) {
    throw new AppError("Verification code has expired.", 400);
  }

  const hashedPassword = await bcryptjs.hash(payload.password, 10);

  await prisma.user.update({
    where: { email: payload.email },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
    },
  });

  return {
    message: "Password reset successful. You can now login with your new password.",
  };
};

export const AuthService = {
  signup,
  verifyAccount,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
