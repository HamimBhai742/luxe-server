import express from "express";
import cors from "cors";
import * as helmet from "helmet";
import morgan from "morgan";
import config from "./app/config/index.js";
import notFoundHandler from "./app/middlewares/notFoundHandler.js";
import errorHandler from "./app/middlewares/errorHandler.js";
import { router } from "./app/routes/index.js";

const app = express();

// Security headers
app.use(helmet.default());

// CORS configuration
app.use(
  cors({
    origin: "*", // Adjust origins in production as needed
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// HTTP Request logging
if (config.nodeEnv !== "test") {
  app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));
}

app.use('/api/v1',router)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Base API route placeholder
app.get("/api/v1", (req, res) => {
  res.status(200).json({
    message: "Welcome to E-commerce API (v1)",
  });
});

// 404 Route Interceptor
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
export { app };
