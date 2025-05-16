/**
 * Models Index
 *
 * This file imports all models and sets up their associations.
 * It handles the synchronization of models with the database.
 */

import sequelize from "../config/database.js";
import User from "./User.js";
import Currency from "./Currency.js";
import MyCurrency from "./MyCurrency.js";
import Customer from "./Customer.js";
import CustomerCurrency from "./CustomerCurrency.js";
import Transaction from "./Transaction.js";
import Earning from "./Earning.js";

// Define additional associations if needed
Currency.hasMany(MyCurrency, { foreignKey: "currency_id", as: "myCurrencies" });
Currency.hasMany(CustomerCurrency, {
  foreignKey: "currency_id",
  as: "customerCurrencies",
});
Currency.hasMany(Transaction, {
  foreignKey: "currency_id",
  as: "transactions",
});

Customer.hasMany(CustomerCurrency, {
  foreignKey: "customer_id",
  as: "currencies",
});
Customer.hasMany(Transaction, {
  foreignKey: "customer_id",
  as: "transactions",
});

/**
 * Synchronize all models with the database
 * @param {Object} options - Sequelize sync options
 * @returns {Promise} Promise representing the sync operation
 */
const syncModels = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log("✅ Database models synchronized successfully");
  } catch (error) {
    console.error("❌ Error synchronizing database models:", error);
    throw error;
  }
};

export {
  sequelize,
  User,
  Currency,
  MyCurrency,
  Customer,
  CustomerCurrency,
  Transaction,
  Earning,
  syncModels,
};
