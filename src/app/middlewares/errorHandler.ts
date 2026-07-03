import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import config from "../config/index.js";
import AppError from "../utils/appError.js";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "PrismaClientKnownRequestError") {
    statusCode = 400;
    message = "Database operation failed. Invalid input or request.";
  }

  // Log non-operational errors in production or any error in development
  if (config.nodeEnv === "development" || !(err instanceof AppError)) {
    console.error(`[Error] ${err.name || "Error"}: ${err.message}`, err.stack);
  }

  const response = {
    success: false,
    message,
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
