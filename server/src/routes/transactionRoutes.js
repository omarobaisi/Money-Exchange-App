import express from "express";
import {
  getTransactions,
  createTransaction,
  getTransactionStats,
} from "../controllers/transactionController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected and require authentication
router.use(authenticate);

// GET /api/transactions - Get all transactions with optional filters
router.get("/", getTransactions);

// POST /api/transactions - Create a new transaction
router.post("/", createTransaction);

// GET /api/transactions/stats - Get transaction statistics
router.get("/stats", getTransactionStats);

export default router;
