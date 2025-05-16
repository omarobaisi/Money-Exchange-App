/**
 * Money Exchange Server
 * Main entry point for the backend server
 *
 * This file sets up the Express server, database connection,
 * and initializes all models and routes.
 */

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { sequelize, syncModels } from "./models/index.js";
import { createDatabase } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import earningRoutes from "./routes/earningRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware configuration
app.use(cors());
app.use(express.json());

/**
 * Test database connection
 * Verifies that the application can connect to the database
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    return false;
  }
}

/**
 * Initialize database and models
 * Creates the database if it doesn't exist and syncs the models
 */
async function initializeDatabase() {
  try {
    // First create the database if it doesn't exist
    await createDatabase();

    // Then test the connection
    const connected = await testConnection();
    if (connected) {
      // Force sync in development to ensure schema matches models
      const syncOptions =
        process.env.NODE_ENV === "development" ? { force: true } : {};
      await syncModels(syncOptions);
      console.log("✅ Database initialized successfully");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}

// Apply routes
app.use("/api/auth", authRoutes);
app.use("/api/earnings", earningRoutes);
app.use("/api/users", userRoutes);
// app.use('/api/currencies', currencyRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/transactions', transactionRoutes);

// Health check route
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
});

// Default route
app.get("/", (req, res) => {
  res.json({
    name: "Money Exchange API",
    version: "1.0.0",
    description: "Backend API for Money Exchange Desktop Application",
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  await initializeDatabase();
});
