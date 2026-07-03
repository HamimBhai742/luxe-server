import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import { AuthService } from "./auth.service.js";

const signup = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required.", 400);
  }
  const result = await AuthService.signup({ name, email, password });
  res.status(201).json({
    success: true,
    message: result.message,
  });
});

const verifyAccount = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new AppError("Email and OTP code are required.", 400);
  }
  const result = await AuthService.verifyAccount({ email, otp });
  res.status(200).json({
    success: true,
    message: result.message,
    accessToken: result.accessToken,
    data: result.user,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }
  const result = await AuthService.login({ email, password });
  res.status(200).json({
    success: true,
    message: result.message,
    accessToken: result.accessToken,
    data: result.user,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email address is required.", 400);
  }
  const result = await AuthService.forgotPassword({ email });
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new AppError("Email address and OTP code are required.", 400);
  }
  const result = await AuthService.verifyOtp({ email, otp });
  res.status(200).json({
    success: true,
    message: result.message,
    token: result.token,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, token, password } = req.body;
  if (!email || (!otp && !token) || !password) {
    throw new AppError("Email, verification code (OTP/token), and new password are required.", 400);
  }
  const result = await AuthService.resetPassword({
    email,
    otp,
    token,
    password,
  });
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { idToken, accessToken } = req.body;
  if (!idToken && !accessToken) {
    throw new AppError("Google idToken or accessToken is required.", 400);
  }
  const result = await AuthService.googleLogin({ idToken, accessToken });
  res.status(200).json({
    success: true,
    message: result.message,
    accessToken: result.accessToken,
    data: result.user,
  });
});

export const AuthController = {
  signup,
  verifyAccount,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleLogin,
};
export default AuthController;
