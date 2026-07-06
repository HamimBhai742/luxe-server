import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import config from "../config/index.js";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized access: No token provided" });
    return;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    res.status(401).json({ success: false, message: "Unauthorized: Invalid token format" });
    return;
  }
  const token = parts[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret as string) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
};

export default auth;
