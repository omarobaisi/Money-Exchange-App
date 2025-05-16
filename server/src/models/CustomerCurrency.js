/**
 * CustomerCurrency Model
 *
 * Tracks currency balances for each customer.
 * Maintains separate cash and check balances per customer per currency.
 * Star field indicates important/frequent currency relationships.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Customer from "./Customer.js";
import Currency from "./Currency.js";

const CustomerCurrency = sequelize.define(
  "CustomerCurrency",
  {
    _id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "_id",
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    check_balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
      field: "check_balance",
    },
    star: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "customer_id",
      references: {
        model: Customer,
        key: "_id",
      },
    },
    currency_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "currency_id",
      references: {
        model: Currency,
        key: "_id",
      },
    },
  },
  {
    tableName: "customer_currency",
    timestamps: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  }
);

// Define relationships
CustomerCurrency.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});
CustomerCurrency.belongsTo(Currency, {
  foreignKey: "currency_id",
  as: "currency",
});

export default CustomerCurrency;
