import http from "node:http";
import app from "./app.js";
import config from "./app/config/index.js";
import prisma from "./app/db/prisma.js";

const server = http.createServer(app);

const startServer = async () => {
  try {
    // 1. Verify database connection
    console.log("Verifying database connection...");
    await prisma.$connect();
    console.log("Database connection established successfully.");

    // 2. Start HTTP server
    server.listen(config.port, () => {
      console.log(`[Server] running in [${config.nodeEnv}] mode on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start the server due to database or other bootstrap error:", error);
    process.exit(1);
  }
};

// Graceful Shutdown Implementation
const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  // Close the server first to stop accepting new requests
  server.close(async (err) => {
    if (err) {
      console.error("Error closing server:", err);
      process.exit(1);
    }
    console.log("HTTP server closed.");

    try {
      // Disconnect database client
      await prisma.$disconnect();
      console.log("Database connections disconnected successfully.");
      process.exit(0);
    } catch (dbError) {
      console.error("Error disconnecting database client during shutdown:", dbError);
      process.exit(1);
    }
  });

  // Force close after 10s if connections persist
  setTimeout(() => {
    console.error("Graceful shutdown timed out. Forcing process exit.");
    process.exit(1);
  }, 10000);
};

// Shutdown listeners
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

// Handle unhandled exceptions & promise rejections
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  // Optional: Trigger graceful shutdown or alert monitoring service
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Operational errors can proceed, but uncaught exception requires restart
  process.exit(1);
});

// Boot the server
startServer();
