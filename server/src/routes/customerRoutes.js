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
  getCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerCurrencyStar,
  adjustClientBalance,
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
 * @route GET /api/customers/:id
 * @desc Get a single customer by ID
 * @access Private
 */
router.get("/:id", getCustomer);

/**
 * @route POST /api/customers
 * @desc Create a new customer
 * @access Private
 */
router.post("/", createCustomer);

/**
 * @route PUT /api/customers/:id
 * @desc Update a customer
 * @access Private
 */
router.put("/:id", updateCustomer);

/**
 * @route DELETE /api/customers/:id
 * @desc Delete a customer
 * @access Private
 */
router.delete("/:id", deleteCustomer);

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
 * @route PUT /api/customers/:customerId/balances/:currencyId/star
 * @desc Toggle star status for a customer's currency
 * @access Private
 */
router.put(
  "/:customerId/balances/:currencyId/star",
  toggleCustomerCurrencyStar
);

/**
 * @route POST /api/customers/adjust-balance
 * @desc Adjust client balance (add/remove cash or check balance)
 * @access Private
 */
router.post("/adjust-balance", adjustClientBalance);

/**
 * @route GET /api/customers/count
 * @desc Get total number of customers
 * @access Private
 */
router.get("/count", getCustomersCount);

export default router;
