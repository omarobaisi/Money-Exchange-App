/**
 * Earning Controller
 *
 * Handles earning-related operations including:
 * - Creating earning records
 * - Retrieving earnings data
 * - Analyzing earnings by period or currency
 */

import { Earning, Currency } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Get all earnings with optional filters
 */
export const getAllEarnings = async (req, res) => {
  try {
    const {
      currencyId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (currencyId) where.currency_id = currencyId;
    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const earnings = await Earning.findAndCountAll({
      where,
      include: [
        {
          model: Currency,
          as: "currency",
        },
      ],
      order: [["date", "DESC"]],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    res.json({
      success: true,
      data: earnings.rows,
      pagination: {
        total: earnings.count,
        page: parseInt(page),
        pages: Math.ceil(earnings.count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching earnings",
    });
  }
};

/**
 * Create a new earning record
 */
export const createEarning = async (req, res) => {
  try {
    const {
      amount,
      currencyId,
      date = new Date(),
      description,
      type = "other",
    } = req.body;

    // Validate required fields
    if (!amount || !currencyId) {
      return res.status(400).json({
        success: false,
        message: "Amount and currency are required",
      });
    }

    // Create the earning record
    const newEarning = await Earning.create({
      amount,
      currency_id: currencyId,
      date: date ? new Date(date) : new Date(),
      description,
      type,
    });

    // Fetch the complete earning with related data
    const completeEarning = await Earning.findOne({
      where: { _id: newEarning._id },
      include: [
        {
          model: Currency,
          as: "currency",
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: completeEarning,
    });
  } catch (error) {
    console.error("Error creating earning record:", error);
    res.status(500).json({
      success: false,
      message: "Error creating earning record",
    });
  }
};

/**
 * Get a specific earning by ID
 */
export const getEarningById = async (req, res) => {
  try {
    const { id } = req.params;

    const earning = await Earning.findOne({
      where: { _id: id },
      include: [
        {
          model: Currency,
          as: "currency",
        },
      ],
    });

    if (!earning) {
      return res.status(404).json({
        success: false,
        message: "Earning record not found",
      });
    }

    res.json({
      success: true,
      data: earning,
    });
  } catch (error) {
    console.error("Error fetching earning record:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching earning record",
    });
  }
};

/**
 * Update an earning record
 */
export const updateEarning = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currencyId, date, description, type } = req.body;

    const earning = await Earning.findOne({
      where: { _id: id },
    });

    if (!earning) {
      return res.status(404).json({
        success: false,
        message: "Earning record not found",
      });
    }

    await earning.update({
      amount: amount !== undefined ? amount : earning.amount,
      currency_id: currencyId !== undefined ? currencyId : earning.currency_id,
      date: date !== undefined ? new Date(date) : earning.date,
      description:
        description !== undefined ? description : earning.description,
      type: type !== undefined ? type : earning.type,
    });

    // Fetch the updated earning with related data
    const updatedEarning = await Earning.findOne({
      where: { _id: id },
      include: [
        {
          model: Currency,
          as: "currency",
        },
      ],
    });

    res.json({
      success: true,
      data: updatedEarning,
    });
  } catch (error) {
    console.error("Error updating earning record:", error);
    res.status(500).json({
      success: false,
      message: "Error updating earning record",
    });
  }
};

/**
 * Delete an earning record
 */
export const deleteEarning = async (req, res) => {
  try {
    const { id } = req.params;

    const earning = await Earning.findOne({
      where: { _id: id },
    });

    if (!earning) {
      return res.status(404).json({
        success: false,
        message: "Earning record not found",
      });
    }

    await earning.destroy();

    res.json({
      success: true,
      message: "Earning record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting earning record:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting earning record",
    });
  }
};

/**
 * Get earnings summary by currency
 */
export const getEarningsByCurrency = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const earningsByCurrency = await Earning.findAll({
      where,
      attributes: [
        "currency_id",
        [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
      ],
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["currency"],
        },
      ],
      group: ["currency_id", "currency._id"],
      order: [[sequelize.literal("total_amount"), "DESC"]],
    });

    res.json({
      success: true,
      data: earningsByCurrency,
    });
  } catch (error) {
    console.error("Error fetching earnings by currency:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching earnings by currency",
    });
  }
};

/**
 * Get earnings summary by type
 */
export const getEarningsByType = async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }
    if (currencyId) {
      where.currency_id = currencyId;
    }

    const earningsByType = await Earning.findAll({
      where,
      attributes: [
        "type",
        [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
      ],
      group: ["type"],
      order: [[sequelize.literal("total_amount"), "DESC"]],
    });

    res.json({
      success: true,
      data: earningsByType,
    });
  } catch (error) {
    console.error("Error fetching earnings by type:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching earnings by type",
    });
  }
};

/**
 * Get total earnings
 */
export const getTotalEarnings = async (req, res) => {
  try {
    const earnings = await Earning.findAll();
    const total = earnings.reduce((sum, earning) => sum + earning.amount, 0);

    res.json({
      success: true,
      total,
    });
  } catch (error) {
    console.error("Error getting total earnings:", error);
    res.status(500).json({
      success: false,
      message: "Error getting total earnings",
    });
  }
};
