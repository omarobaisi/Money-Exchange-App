/**
 * Customer Routes
 *
 * Defines API endpoints for customer management and balance operations
 */

import express from "express";
import {
  getAllCustomers,
  createCustomer,
  getCustomerBalances,
  getCustomerBalance,
  updateCustomerBalance,
  toggleCustomerStar,
  getCustomersCount,
} from "../controllers/customerController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/customers
 * @desc Get all customers
 * @access Private
 */
router.get("/", getAllCustomers);

/**
 * @route POST /api/customers
 * @desc Create a new customer
 * @access Private
 */
router.post("/", createCustomer);

/**
 * @route GET /api/customers/:customerId/balances
 * @desc Get all currency balances for a customer
 * @access Private
 */
router.get("/:customerId/balances", getCustomerBalances);

/**
 * @route GET /api/customers/:customerId/currencies/:currencyId/balance
 * @desc Get customer balance for a specific currency
 * @access Private
 */
router.get("/:customerId/currencies/:currencyId/balance", getCustomerBalance);

/**
 * @route PUT /api/customers/:customerId/currencies/:currencyId/balance
 * @desc Update customer balance for a currency
 * @access Private
 */
router.put(
  "/:customerId/currencies/:currencyId/balance",
  updateCustomerBalance
);

/**
 * @route PUT /api/customers/:customerId/star
 * @desc Toggle star status for a customer
 * @access Private
 */
router.put("/:customerId/star", toggleCustomerStar);

/**
 * @route GET /api/customers/count
 * @desc Get total number of customers
 * @access Private
 */
router.get("/count", getCustomersCount);

export default router;
