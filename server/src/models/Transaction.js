/**
 * Transaction Model
 *
 * Represents money exchange transactions between the company and customers.
 * Tracks amount, commission, movement type, and related entities.
 * Supports Arabic text in notes through utf8mb4 encoding.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Customer from "./Customer.js";
import Currency from "./Currency.js";

const Transaction = sequelize.define(
  "Transaction",
  {
    _id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "_id",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    commission: {
      type: DataTypes.DECIMAL(5, 2), // Changed from DECIMAL(2, 2) to support higher commission values
      defaultValue: 0.0,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    movement: {
      type: DataTypes.ENUM(
        "buy-cash",
        "sell-cash",
        "buy-check",
        "sell-check",
        "check-collection"
      ),
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    tableName: "transaction",
    timestamps: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  }
);

// Define relationships
Transaction.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
Transaction.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });

export default Transaction;
