/**
 * Earnings Routes
 *
 * Defines API endpoints for managing earnings records
 */

import express from "express";
import {
  getAllEarnings,
  createEarning,
  getEarningById,
  updateEarning,
  deleteEarning,
  getEarningsByCurrency,
  getEarningsByType,
} from "../controllers/earningController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/earnings
 * @desc Get all earnings with optional filters
 * @access Private
 */
router.get("/", getAllEarnings);

/**
 * @route POST /api/earnings
 * @desc Create a new earning record
 * @access Private
 */
router.post("/", createEarning);

/**
 * @route GET /api/earnings/:id
 * @desc Get a specific earning by ID
 * @access Private
 */
router.get("/:id", getEarningById);

/**
 * @route PUT /api/earnings/:id
 * @desc Update an earning record
 * @access Private
 */
router.put("/:id", updateEarning);

/**
 * @route DELETE /api/earnings/:id
 * @desc Delete an earning record
 * @access Private
 */
router.delete("/:id", deleteEarning);

/**
 * @route GET /api/earnings/reports/by-currency
 * @desc Get earnings summary grouped by currency
 * @access Private
 */
router.get("/reports/by-currency", getEarningsByCurrency);

/**
 * @route GET /api/earnings/reports/by-type
 * @desc Get earnings summary grouped by type
 * @access Private
 */
router.get("/reports/by-type", getEarningsByType);

export default router;
