/**
 * Authentication Routes
 *
 * Defines API endpoints for user authentication functionality
 * including login, registration, and initial setup.
 */

import express from "express";
import {
  login,
  register,
  completeInitialSetup,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login a user and get token
 * @access Public
 */
router.post("/login", login);

/**
 * @route POST /api/auth/register
 * @desc Register a new user (only allowed for initial setup)
 * @access Public
 */
router.post("/register", register);

/**
 * @route PUT /api/auth/setup/:userId/complete
 * @desc Complete the initial setup process
 * @access Private
 */
router.put("/setup/:userId/complete", authenticate, completeInitialSetup);

export default router;
