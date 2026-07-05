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
  TGoogleLoginInput,
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

  if (user.status === "Suspended") {
    throw new AppError("Your account has been suspended. Please contact support.", 403);
  }

  if (user.status === "Pending") {
    throw new AppError("Your account registration is pending approval or verification.", 403);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email address first before logging in.", 403);
  }

  if (!user.password) {
    throw new AppError("This account uses social login. Please log in using Google.", 400);
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
      role: user.role,
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

const googleLogin = async (payload: TGoogleLoginInput) => {
  const { idToken, accessToken } = payload;
  if (!idToken && !accessToken) {
    throw new AppError("Google Access Token or ID Token is required.", 400);
  }

  let email: string | undefined;
  let name: string | undefined;

  if (idToken) {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!response.ok) {
        throw new AppError("Invalid Google ID Token.", 401);
      }
      const data = (await response.json()) as any;

      if (!data.email) {
        throw new AppError("Email not returned by Google.", 400);
      }

      if (config.googleClientId && data.aud !== config.googleClientId) {
        throw new AppError("Invalid token audience.", 401);
      }

      email = data.email;
      name = data.name || data.email.split("@")[0];
    } catch (error: any) {
      throw new AppError(error.message || "Google ID Token verification failed.", 401);
    }
  } else if (accessToken) {
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new AppError("Invalid Google Access Token.", 401);
      }
      const data = (await response.json()) as any;

      if (!data.email) {
        throw new AppError("Email not returned by Google.", 400);
      }

      email = data.email;
      name = data.name || data.email.split("@")[0];
    } catch (error: any) {
      throw new AppError(error.message || "Google Access Token verification failed.", 401);
    }
  }

  if (!email) {
    throw new AppError("Failed to retrieve user email from Google.", 400);
  }

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || "Google User",
        password: null as any,
        isVerified: true,
      },
    });
  } else if (!user.isVerified) {
    user = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
      },
    });
  }

  if (user.status === "Suspended") {
    throw new AppError("Your account has been suspended. Please contact support.", 403);
  }

  if (user.status === "Pending") {
    throw new AppError("Your account registration is pending approval or verification.", 403);
  }

  const newAccessToken = createToken(user.id, user.email);

  return {
    message: "Login successful.",
    accessToken: newAccessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const AuthService = {
  signup,
  verifyAccount,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleLogin,
};
