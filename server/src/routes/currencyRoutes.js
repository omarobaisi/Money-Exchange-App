/**
 * Currency Routes
 *
 * Defines API endpoints for currency management and balance operations
 */

import express from "express";
import {
  getAllCurrencies,
  createCurrency,
  getCompanyBalances,
  getCompanyBalance,
  updateCompanyBalance,
  toggleCurrencyStar,
  adjustCompanyBalance,
} from "../controllers/currencyController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/currencies
 * @desc Get all currencies
 * @access Private
 */
router.get("/", getAllCurrencies);

/**
 * @route POST /api/currencies
 * @desc Create a new currency
 * @access Private
 */
router.post("/", createCurrency);

/**
 * @route GET /api/currencies/balances
 * @desc Get all company currency balances
 * @access Private
 */
router.get("/balances", getCompanyBalances);

/**
 * @route GET /api/currencies/:currencyId/balance
 * @desc Get company balance for a specific currency
 * @access Private
 */
router.get("/:currencyId/balance", getCompanyBalance);

/**
 * @route PUT /api/currencies/:currencyId/balance
 * @desc Update company balance for a currency
 * @access Private
 */
router.put("/:currencyId/balance", updateCompanyBalance);

/**
 * @route PUT /api/currencies/:currencyId/star
 * @desc Toggle star status for a currency
 * @access Private
 */
router.put("/:currencyId/star", toggleCurrencyStar);

/**
 * @route POST /api/currencies/adjust-balance
 * @desc Adjust company balance (add/remove cash or check balance)
 * @access Private
 */
router.post("/adjust-balance", adjustCompanyBalance);

export default router;
