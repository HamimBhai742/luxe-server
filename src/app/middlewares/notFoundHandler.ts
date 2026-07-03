import type { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

export default notFoundHandler;
