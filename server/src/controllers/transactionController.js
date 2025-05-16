/**
 * Transaction Controller
 *
 * Handles transaction-related operations including:
 * - Creating transactions
 * - Managing transaction records
 * - Updating balances
 */

import {
  Transaction,
  Customer,
  Currency,
  MyCurrency,
  CustomerCurrency,
} from "../models/index.js";
import { Op } from "sequelize";

/**
 * Get all transactions with optional filters
 */
export const getTransactions = async (req, res) => {
  try {
    const {
      customerId,
      currencyId,
      movement,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (customerId) where.customer_id = customerId;
    if (currencyId) where.currency_id = currencyId;
    if (movement) where.movement = movement;
    if (startDate && endDate) {
      where.created = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const transactions = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
        },
        {
          model: Currency,
          as: "currency",
        },
      ],
      order: [["created", "DESC"]],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    res.json({
      success: true,
      data: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page),
        pages: Math.ceil(transactions.count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
    });
  }
};

/**
 * Create a new transaction and update balances
 */
export const createTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      amount,
      commission = 0,
      note,
      movement,
      customerId,
      currencyId,
    } = req.body;

    // Validate required fields
    if (!amount || !movement || !customerId || !currencyId) {
      return res.status(400).json({
        success: false,
        message: "Amount, movement, customer, and currency are required",
      });
    }

    // Create the transaction
    const newTransaction = await Transaction.create(
      {
        amount,
        commission,
        note,
        movement,
        customer_id: customerId,
        currency_id: currencyId,
      },
      { transaction }
    );

    // Update balances based on movement type
    const isBuy = movement.includes("buy");
    const isCash = movement.includes("cash");
    const isCheck = movement.includes("check");
    const isCollection = movement === "check-collection";

    // Update company balance
    const [myCurrency] = await MyCurrency.findOrCreate({
      where: { currency_id: currencyId },
      defaults: {
        balance: 0,
        check_balance: 0,
        star: false,
      },
      transaction,
    });

    // Update customer balance
    const [customerCurrency] = await CustomerCurrency.findOrCreate({
      where: {
        customer_id: customerId,
        currency_id: currencyId,
      },
      defaults: {
        balance: 0,
        check_balance: 0,
        star: false,
      },
      transaction,
    });

    // Calculate balance changes
    const amountWithCommission = amount + commission;

    if (isBuy) {
      // Company buys from customer
      if (isCash) {
        await myCurrency.update(
          {
            balance: myCurrency.balance + amount,
          },
          { transaction }
        );
        await customerCurrency.update(
          {
            balance: customerCurrency.balance - amount,
          },
          { transaction }
        );
      } else if (isCheck) {
        await myCurrency.update(
          {
            check_balance: myCurrency.check_balance + amount,
          },
          { transaction }
        );
        await customerCurrency.update(
          {
            check_balance: customerCurrency.check_balance - amount,
          },
          { transaction }
        );
      }
    } else if (isCollection) {
      // Check collection
      await myCurrency.update(
        {
          balance: myCurrency.balance + amount,
          check_balance: myCurrency.check_balance - amount,
        },
        { transaction }
      );
    } else {
      // Company sells to customer
      if (isCash) {
        await myCurrency.update(
          {
            balance: myCurrency.balance - amount,
          },
          { transaction }
        );
        await customerCurrency.update(
          {
            balance: customerCurrency.balance + amount,
          },
          { transaction }
        );
      } else if (isCheck) {
        await myCurrency.update(
          {
            check_balance: myCurrency.check_balance - amount,
          },
          { transaction }
        );
        await customerCurrency.update(
          {
            check_balance: customerCurrency.check_balance + amount,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Fetch the complete transaction with related data
    const completeTransaction = await Transaction.findOne({
      where: { _id: newTransaction._id },
      include: [
        {
          model: Customer,
          as: "customer",
        },
        {
          model: Currency,
          as: "currency",
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: completeTransaction,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error creating transaction",
    });
  }
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.created = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const stats = await Transaction.findAll({
      where,
      attributes: [
        "movement",
        "currency_id",
        [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
        [sequelize.fn("SUM", sequelize.col("commission")), "total_commission"],
      ],
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["currency"],
        },
      ],
      group: ["movement", "currency_id", "currency._id"],
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transaction statistics",
    });
  }
};
