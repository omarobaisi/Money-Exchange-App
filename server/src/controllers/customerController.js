/**
 * Customer Controller
 *
 * Handles customer-related operations including:
 * - Managing customers
 * - Managing customer currency balances
 * - Getting customer balance information
 */

import { Customer, CustomerCurrency, Currency, Transaction, sequelize } from "../models/index.js";

/**
 * Get all customers
 */
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customers",
    });
  }
};

/**
 * Create a new customer
 */
export const createCustomer = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const newCustomer = await Customer.create({ name });

    res.status(201).json({
      success: true,
      data: newCustomer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      message: "Error creating customer",
    });
  }
};

/**
 * Get customer balances for all currencies
 */
export const getCustomerBalances = async (req, res) => {
  try {
    const { customerId } = req.params;

    const balances = await CustomerCurrency.findAll({
      where: { customer_id: customerId },
      include: [
        {
          model: Currency,
          as: "currency",
        },
      ],
      order: [[{ model: Currency, as: "currency" }, "currency", "ASC"]],
    });

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    console.error("Error fetching customer balances:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer balances",
    });
  }
};

/**
 * Get customer balance for a specific currency
 */
export const getCustomerBalance = async (req, res) => {
  try {
    const { customerId, currencyId } = req.params;

    const balance = await CustomerCurrency.findOne({
      where: {
        customer_id: customerId,
        currency_id: currencyId,
      },
      include: [
        {
          model: Currency,
          as: "currency",
        },
      ],
    });

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: "Balance not found for this customer and currency",
      });
    }

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error("Error fetching customer balance:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer balance",
    });
  }
};

/**
 * Update customer balance for a currency
 */
export const updateCustomerBalance = async (req, res) => {
  try {
    const { customerId, currencyId } = req.params;
    const { balance, check_balance, star } = req.body;

    const [customerCurrency, created] = await CustomerCurrency.findOrCreate({
      where: {
        customer_id: customerId,
        currency_id: currencyId,
      },
      defaults: {
        balance: balance || 0,
        check_balance: check_balance || 0,
        star: star || false,
      },
    });

    if (!created) {
      await customerCurrency.update({
        balance: balance !== undefined ? balance : customerCurrency.balance,
        check_balance:
          check_balance !== undefined
            ? check_balance
            : customerCurrency.check_balance,
        star: star !== undefined ? star : customerCurrency.star,
      });
    }

    const updatedBalance = await CustomerCurrency.findOne({
      where: {
        customer_id: customerId,
        currency_id: currencyId,
      },
      include: [
        {
          model: Currency,
          as: "currency",
        },
      ],
    });

    res.json({
      success: true,
      data: updatedBalance,
    });
  } catch (error) {
    console.error("Error updating customer balance:", error);
    res.status(500).json({
      success: false,
      message: "Error updating customer balance",
    });
  }
};

/**
 * Toggle star status for a customer
 */
export const toggleCustomerStar = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await customer.update({
      star: !customer.star,
    });

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error toggling customer star:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling customer star",
    });
  }
};

/**
 * Update a customer
 */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ...rest } = req.body;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    await customer.update({ name, ...rest });
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating customer" });
  }
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    await customer.destroy();
    res.json({ success: true, message: "Customer deleted" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting customer" });
  }
};

/**
 * Toggle star status for a customer's currency
 */
export const toggleCustomerCurrencyStar = async (req, res) => {
  try {
    const { customerId, currencyId } = req.params;
    const customerCurrency = await CustomerCurrency.findOne({
      where: { customer_id: customerId, currency_id: currencyId },
    });
    if (!customerCurrency) {
      return res
        .status(404)
        .json({ success: false, message: "Customer currency not found" });
    }
    await customerCurrency.update({ star: !customerCurrency.star });
    res.json({ success: true, data: customerCurrency });
  } catch (error) {
    console.error("Error toggling customer currency star:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error toggling customer currency star",
      });
  }
};

/**
 * Get total number of customers
 */
export const getCustomersCount = async (req, res) => {
  try {
    const count = await Customer.count();

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error getting customers count:", error);
    res.status(500).json({
      success: false,
      message: "Error getting customers count",
    });
  }
};

/**
 * Get a single customer by ID
 */
export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: CustomerCurrency,
          as: "currencies",
          include: [
            {
              model: Currency,
              as: "currency",
            },
          ],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer",
    });
  }
};

/**
 * Adjust client balance (add/remove cash or check balance)
 */
export const adjustClientBalance = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { customerId, currencyId, balanceType, adjustmentType, amount, note } = req.body;

    // Validate required fields
    if (!customerId || !currencyId || !balanceType || !adjustmentType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Customer, currency, balance type, adjustment type, and amount are required",
      });
    }

    // Validate balance type
    if (!["cash", "check"].includes(balanceType)) {
      return res.status(400).json({
        success: false,
        message: "Balance type must be either 'cash' or 'check'",
      });
    }

    // Validate adjustment type
    if (!["add", "remove"].includes(adjustmentType)) {
      return res.status(400).json({
        success: false,
        message: "Adjustment type must be either 'add' or 'remove'",
      });
    }

    // Validate amount
    const adjustmentAmount = parseFloat(amount);
    if (adjustmentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if currency exists
    const currency = await Currency.findByPk(currencyId);
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: "Currency not found",
      });
    }

    // Get or create customer balance for this currency
    const [customerCurrency, created] = await CustomerCurrency.findOrCreate({
      where: {
        customer_id: customerId,
        currency_id: currencyId,
      },
      defaults: {
        balance: 0.0,
        check_balance: 0.0,
        star: false,
      },
      transaction,
    });

    // Calculate new balance
    const currentBalance = parseFloat(
      balanceType === "cash" ? customerCurrency.balance : customerCurrency.check_balance
    );
    
    let newBalance;
    if (adjustmentType === "add") {
      newBalance = currentBalance + adjustmentAmount;
    } else {
      newBalance = currentBalance - adjustmentAmount;
      // Check for negative balance
      if (newBalance < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient ${balanceType} balance. Current balance: ${currentBalance}`,
        });
      }
    }

    // Update the balance
    const updateData = {};
    if (balanceType === "cash") {
      updateData.balance = newBalance;
    } else {
      updateData.check_balance = newBalance;
    }

    await customerCurrency.update(updateData, { transaction });

    // Determine movement type for transaction history
    const movementType = `balance-adjustment-${balanceType}-${adjustmentType}`;

    // Create transaction record for history
    await Transaction.create(
      {
        amount: adjustmentAmount,
        commission: 0,
        note: note || `Client balance adjustment: ${adjustmentType} ${adjustmentAmount} ${balanceType} balance for ${customer.name}`,
        movement: movementType,
        customer_id: customerId,
        currency_id: currencyId,
      },
      { transaction }
    );

    await transaction.commit();

    // Fetch updated balance with currency info
    const updatedBalance = await CustomerCurrency.findOne({
      where: {
        customer_id: customerId,
        currency_id: currencyId,
      },
      include: [
        {
          model: Currency,
          as: "currency",
        },
      ],
    });

    res.json({
      success: true,
      data: {
        balance: updatedBalance,
        adjustment: {
          type: adjustmentType,
          balanceType,
          amount: adjustmentAmount,
          previousBalance: currentBalance,
          newBalance,
        },
      },
      message: `Successfully ${adjustmentType}ed ${adjustmentAmount} to ${customer.name}'s ${balanceType} balance`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error adjusting client balance:", error);
    res.status(500).json({
      success: false,
      message: "Error adjusting client balance",
    });
  }
};
