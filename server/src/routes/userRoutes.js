/**
 * User Routes
 *
 * Defines API endpoints for user profile management
 */

import express from "express";
import { getUser, updateUser } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get("/me", authenticate, getUser);

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put("/me", authenticate, updateUser);

export default router;
