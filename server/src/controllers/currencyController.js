/**
 * Currency Controller
 *
 * Handles currency-related operations including:
 * - Managing currencies
 * - Managing company currency balances
 * - Getting balance information
 */

import { Currency, MyCurrency, Transaction, sequelize } from "../models/index.js";

/**
 * Get all currencies
 */
export const getAllCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.findAll({
      order: [["currency", "ASC"]],
    });

    res.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    console.error("Error fetching currencies:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب العملات",
    });
  }
};

/**
 * Create a new currency
 */
export const createCurrency = async (req, res) => {
  try {
    const { currency } = req.body;

    if (!currency) {
      return res.status(400).json({
        success: false,
        message: "اسم العملة مطلوب",
      });
    }

    const newCurrency = await Currency.create({ currency });

    res.status(201).json({
      success: true,
      data: newCurrency,
    });
  } catch (error) {
    console.error("Error creating currency:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في إنشاء العملة",
    });
  }
};

/**
 * Get company balances for all currencies
 */
export const getCompanyBalances = async (req, res) => {
  try {
    const balances = await MyCurrency.findAll({
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
    console.error("Error fetching company balances:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب أرصدة الشركة",
    });
  }
};

/**
 * Get company balance for a specific currency
 */
export const getCompanyBalance = async (req, res) => {
  try {
    const { currencyId } = req.params;

    const balance = await MyCurrency.findOne({
      where: { currency_id: currencyId },
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
        message: "لم يتم العثور على رصيد لهذه العملة",
      });
    }

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error("Error fetching company balance:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب رصيد الشركة",
    });
  }
};

/**
 * Update company balance for a currency
 */
export const updateCompanyBalance = async (req, res) => {
  try {
    const { currencyId } = req.params;
    const { balance, check_balance, star } = req.body;

    const [myCurrency, created] = await MyCurrency.findOrCreate({
      where: { currency_id: currencyId },
      defaults: {
        balance: balance || 0,
        check_balance: check_balance || 0,
        star: star || false,
      },
    });

    if (!created) {
      await myCurrency.update({
        balance: balance !== undefined ? balance : myCurrency.balance,
        check_balance:
          check_balance !== undefined
            ? check_balance
            : myCurrency.check_balance,
        star: star !== undefined ? star : myCurrency.star,
      });
    }

    const updatedBalance = await MyCurrency.findOne({
      where: { currency_id: currencyId },
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
    console.error("Error updating company balance:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث رصيد الشركة",
    });
  }
};

/**
 * Toggle star status for a currency
 */
export const toggleCurrencyStar = async (req, res) => {
  try {
    const { currencyId } = req.params;

    const myCurrency = await MyCurrency.findOne({
      where: { currency_id: currencyId },
    });

    if (!myCurrency) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على رصيد العملة",
      });
    }

    await myCurrency.update({
      star: !myCurrency.star,
    });

    res.json({
      success: true,
      data: myCurrency,
    });
  } catch (error) {
    console.error("Error toggling currency star:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في تبديل نجمة العملة",
    });
  }
};

/**
 * Adjust company balance (add/remove cash or check balance)
 */
export const adjustCompanyBalance = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { currencyId, balanceType, adjustmentType, amount, note } = req.body;

    // Validate required fields
    if (!currencyId || !balanceType || !adjustmentType || !amount) {
      return res.status(400).json({
        success: false,
        message: "العملة ونوع الرصيد ونوع التعديل والمبلغ مطلوبة",
      });
    }

    // Validate balance type
    if (!["cash", "check"].includes(balanceType)) {
      return res.status(400).json({
        success: false,
        message: "نوع الرصيد يجب أن يكون إما 'نقدي' أو 'شيكات'",
      });
    }

    // Validate adjustment type
    if (!["add", "remove"].includes(adjustmentType)) {
      return res.status(400).json({
        success: false,
        message: "نوع التعديل يجب أن يكون إما 'إضافة' أو 'خصم'",
      });
    }

    // Validate amount
    const adjustmentAmount = parseFloat(amount);
    if (adjustmentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "المبلغ يجب أن يكون أكبر من 0",
      });
    }

    // Check if currency exists
    const currency = await Currency.findByPk(currencyId);
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: "العملة غير موجودة",
      });
    }

    // Get or create company balance for this currency
    const [myCurrency, created] = await MyCurrency.findOrCreate({
      where: { currency_id: currencyId },
      defaults: {
        balance: 0.0,
        check_balance: 0.0,
        star: false,
      },
      transaction,
    });

    // Calculate new balance
    const currentBalance = parseFloat(
      balanceType === "cash" ? myCurrency.balance : myCurrency.check_balance
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
          message: `رصيد ${balanceType === 'cash' ? 'نقدي' : 'شيكات'} غير كافٍ. الرصيد الحالي: ${currentBalance}`,
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

    await myCurrency.update(updateData, { transaction });

    // Determine movement type for transaction history
    const movementType = `balance-adjustment-${balanceType}-${adjustmentType}`;

    // Create transaction record for history
    await Transaction.create(
      {
        amount: adjustmentAmount,
        commission: 0,
        note: note || `تعديل رصيد الشركة: ${adjustmentType === 'add' ? 'إضافة' : 'خصم'} ${adjustmentAmount} ${balanceType === 'cash' ? 'رصيد نقدي' : 'رصيد شيكات'}`,
        movement: movementType,
        customer_id: null, // System adjustment, no customer
        currency_id: currencyId,
      },
      { transaction }
    );

    await transaction.commit();

    // Fetch updated balance with currency info
    const updatedBalance = await MyCurrency.findOne({
      where: { currency_id: currencyId },
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
      message: `تم ${adjustmentType === 'add' ? 'إضافة' : 'خصم'} ${adjustmentAmount} ${balanceType === 'cash' ? 'للرصيد النقدي' : 'لرصيد الشيكات'} بنجاح`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error adjusting company balance:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في تعديل رصيد الشركة",
    });
  }
};
