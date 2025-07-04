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
  Earning,
  sequelize,
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

    // Calculate commission amount if it's a check transaction
    const isCheck = movement.includes("check");
    let commissionAmount = 0;
    if (isCheck && commission > 0) {
      commissionAmount = amount * commission;
      // Create earning record for commission
      await Earning.create(
        {
          amount: commissionAmount,
          currency_id: currencyId,
          type: "commission",
          description: `Commission for transaction #${newTransaction._id}`,
          transaction_id: newTransaction._id,
        },
        { transaction }
      );
    }

    // Update balances based on movement type
    const isBuy = movement.includes("buy");
    const isCash = movement.includes("cash");
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
    const myBalance = parseFloat(myCurrency.balance);
    const myCheckBalance = parseFloat(myCurrency.check_balance);

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
    const custBalance = parseFloat(customerCurrency.balance);
    const custCheckBalance = parseFloat(customerCurrency.check_balance);

    // Calculate balance changes
    const amountWithCommission = amount + commissionAmount;

    if (isBuy) {
      // Company buys from customer
      if (isCash) {
        await myCurrency.update(
          {
            balance: myBalance + amount,
          },
          { transaction }
        );
        await customerCurrency.update(
          {
            balance: custBalance - amount,
          },
          { transaction }
        );
      } else if (isCheck) {
        // For check transactions, handle both amount and commission
        await myCurrency.update(
          {
            check_balance: myCheckBalance + amountWithCommission, // Add both amount and commission
          },
          { transaction }
        );
        await customerCurrency.update(
          {
            check_balance: custCheckBalance - amountWithCommission, // Subtract both amount and commission
          },
          { transaction }
        );
      }
    } else if (isCollection) {
      // Check collection
      await myCurrency.update(
        {
          balance: myBalance + amount,
          check_balance: myCheckBalance - amount,
        },
        { transaction }
      );
    } else {
      // Company sells to customer
      if (isCash) {
        await myCurrency.update(
          {
            balance: myBalance - amount,
          },
          { transaction }
        );
        await customerCurrency.update(
          {
            balance: custBalance + amount,
          },
          { transaction }
        );
      } else if (isCheck) {
        // For check transactions, handle both amount and commission
        await myCurrency.update(
          {
            check_balance: myCheckBalance - amountWithCommission, // Subtract both amount and commission
          },
          { transaction }
        );
        await customerCurrency.update(
          {
            check_balance: custCheckBalance + amountWithCommission, // Add both amount and commission
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

/**
 * Update a transaction and its associated earning
 */
export const updateTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      amount,
      commission = 0,
      note,
      movement,
      customerId,
      currencyId,
    } = req.body;

    const existingTransaction = await Transaction.findOne({
      where: { _id: id },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Update transaction
    await existingTransaction.update(
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

    // Handle commission earning
    const isCheck = movement.includes("check");
    const existingEarning = await Earning.findOne({
      where: { transaction_id: id },
    });

    if (isCheck && commission > 0) {
      const commissionAmount = amount * commission;

      if (existingEarning) {
        // Update existing earning
        await existingEarning.update(
          {
            amount: commissionAmount,
            currency_id: currencyId,
          },
          { transaction }
        );
      } else {
        // Create new earning
        await Earning.create(
          {
            amount: commissionAmount,
            currency_id: currencyId,
            type: "commission",
            description: `Commission for transaction #${id}`,
            transaction_id: id,
          },
          { transaction }
        );
      }
    } else if (existingEarning) {
      // Delete earning if transaction is no longer a check transaction
      await existingEarning.destroy({ transaction });
    }

    await transaction.commit();

    // Fetch updated transaction with related data
    const updatedTransaction = await Transaction.findOne({
      where: { _id: id },
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

    res.json({
      success: true,
      data: updatedTransaction,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error updating transaction",
    });
  }
};

/**
 * Delete a transaction and its associated earning
 */
export const deleteTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const existingTransaction = await Transaction.findOne({
      where: { _id: id },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Delete associated earning if exists
    await Earning.destroy({
      where: { transaction_id: id },
      transaction,
    });

    // Delete transaction
    await existingTransaction.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting transaction",
    });
  }
};
