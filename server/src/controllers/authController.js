/**
 * Authentication Controller
 *
 * Handles user authentication operations including
 * login, registration, and initial application setup.
 */

import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

/**
 * Login user and generate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Return user info and token
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        isInitialSetup: user.isInitialSetup,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Register a new user (only for first time setup)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { username, password, name } = req.body;

    // Check if any user already exists
    const userCount = await User.count();
    if (userCount > 0) {
      return res.status(403).json({
        success: false,
        message:
          "User already exists. Registration is only allowed for initial setup.",
      });
    }

    // Validate required fields
    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Username, password, and name are required",
      });
    }

    // Create new user
    const user = await User.create({
      username,
      password,
      name,
      role: "admin", // First user is always admin
      isInitialSetup: true, // Mark that this user needs to complete initial setup
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        isInitialSetup: user.isInitialSetup,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Complete the initial setup process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeInitialSetup = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Mark setup as complete
    user.isInitialSetup = false;
    await user.save();

    res.json({
      success: true,
      message: "Initial setup completed successfully",
    });
  } catch (error) {
    console.error("Setup completion error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
