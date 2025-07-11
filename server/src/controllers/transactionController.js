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
 * Helper function to calculate commission amount
 */
const calculateCommission = (amount, commission, movement) => {
  const isCheck = movement.includes("check");
  return isCheck && commission > 0 ? amount * commission : 0;
};

/**
 * Helper function to manage earning records
 */
const manageEarning = async (
  transactionId,
  commissionAmount,
  currencyId,
  operation,
  transaction
) => {
  if (operation === "delete") {
    await Earning.destroy({
      where: { transaction_id: transactionId },
      transaction,
    });
  } else if (commissionAmount > 0) {
    const existingEarning = await Earning.findOne({
      where: { transaction_id: transactionId },
    });

    if (existingEarning) {
      await existingEarning.update(
        {
          amount: commissionAmount,
          currency_id: currencyId,
        },
        { transaction }
      );
    } else {
      await Earning.create(
        {
          amount: commissionAmount,
          currency_id: currencyId,
          type: "commission",
          description: `Commission for transaction #${transactionId}`,
          transaction_id: transactionId,
        },
        { transaction }
      );
    }
  } else {
    // Delete earning if commission is 0
    await Earning.destroy({
      where: { transaction_id: transactionId },
      transaction,
    });
  }
};

/**
 * Helper function to update balances based on transaction
 */
const updateBalances = async (transactionData, operation, transaction) => {
  const {
    amount,
    movement,
    customerId,
    currencyId,
    commissionAmount = 0,
  } = transactionData;

  // Get or create currency records
  const [myCurrency] = await MyCurrency.findOrCreate({
    where: { currency_id: currencyId },
    defaults: {
      balance: 0,
      check_balance: 0,
      star: false,
    },
    transaction,
  });

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

  // Parse current balances
  const myBalance = parseFloat(myCurrency.balance);
  const myCheckBalance = parseFloat(myCurrency.check_balance);
  const custBalance = parseFloat(customerCurrency.balance);
  const custCheckBalance = parseFloat(customerCurrency.check_balance);

  // Determine transaction type
  const isBuy = movement.includes("buy");
  const isCash = movement.includes("cash");
  const isCheck = movement.includes("check");
  const isCollection = movement === "check-collection";

  // Calculate the total amount including commission
  const amountWithCommission = amount + commissionAmount;

  // Determine the multiplier based on operation
  // For create: normal, for delete: reverse, for update: handled separately
  const multiplier = operation === "delete" ? -1 : 1;

  // Apply balance changes
  if (isBuy) {
    // Company buys from customer
    if (isCash) {
      await myCurrency.update(
        {
          balance: myBalance + amount * multiplier,
        },
        { transaction }
      );
      await customerCurrency.update(
        {
          balance: custBalance - amount * multiplier,
        },
        { transaction }
      );
    } else if (isCheck) {
      await myCurrency.update(
        {
          check_balance: myCheckBalance + amountWithCommission * multiplier,
        },
        { transaction }
      );
      await customerCurrency.update(
        {
          check_balance: custCheckBalance - amountWithCommission * multiplier,
        },
        { transaction }
      );
    }
  } else if (isCollection) {
    // Check collection
    await myCurrency.update(
      {
        balance: myBalance + amount * multiplier,
        check_balance: myCheckBalance - amount * multiplier,
      },
      { transaction }
    );
  } else {
    // Company sells to customer
    if (isCash) {
      await myCurrency.update(
        {
          balance: myBalance - amount * multiplier,
        },
        { transaction }
      );
      await customerCurrency.update(
        {
          balance: custBalance + amount * multiplier,
        },
        { transaction }
      );
    } else if (isCheck) {
      await myCurrency.update(
        {
          check_balance: myCheckBalance - amountWithCommission * multiplier,
        },
        { transaction }
      );
      await customerCurrency.update(
        {
          check_balance: custCheckBalance + amountWithCommission * multiplier,
        },
        { transaction }
      );
    }
  }
};

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

    // Calculate commission amount
    const commissionAmount = calculateCommission(amount, commission, movement);

    // Manage earning record
    await manageEarning(
      newTransaction._id,
      commissionAmount,
      currencyId,
      "create",
      transaction
    );

    // Update balances
    await updateBalances(
      {
        amount,
        movement,
        customerId,
        currencyId,
        commissionAmount,
      },
      "create",
      transaction
    );

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

    // Calculate old commission amount to reverse balances
    const oldCommissionAmount = calculateCommission(
      existingTransaction.amount,
      existingTransaction.commission,
      existingTransaction.movement
    );

    // Reverse the old transaction's effect on balances
    await updateBalances(
      {
        amount: existingTransaction.amount,
        movement: existingTransaction.movement,
        customerId: existingTransaction.customer_id,
        currencyId: existingTransaction.currency_id,
        commissionAmount: oldCommissionAmount,
      },
      "delete",
      transaction
    );

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

    // Calculate new commission amount
    const newCommissionAmount = calculateCommission(
      amount,
      commission,
      movement
    );

    // Manage earning record
    await manageEarning(
      id,
      newCommissionAmount,
      currencyId,
      "update",
      transaction
    );

    // Apply the new transaction's effect on balances
    await updateBalances(
      {
        amount,
        movement,
        customerId,
        currencyId,
        commissionAmount: newCommissionAmount,
      },
      "create",
      transaction
    );

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

    // Calculate commission amount
    const commissionAmount = calculateCommission(
      existingTransaction.amount,
      existingTransaction.commission,
      existingTransaction.movement
    );

    // Reverse the transaction's effect on balances
    await updateBalances(
      {
        amount: existingTransaction.amount,
        movement: existingTransaction.movement,
        customerId: existingTransaction.customer_id,
        currencyId: existingTransaction.currency_id,
        commissionAmount,
      },
      "delete",
      transaction
    );

    // Delete associated earning
    await manageEarning(
      id,
      0,
      existingTransaction.currency_id,
      "delete",
      transaction
    );

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
