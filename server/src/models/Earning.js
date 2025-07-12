/**
 * Earning Model
 *
 * Represents earnings related to currency operations
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Currency from "./Currency.js";

const Earning = sequelize.define(
  "earning",
  {
    _id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    currency_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "currency",
        key: "_id",
      },
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "transaction",
        key: "_id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("commission", "exchange", "fee", "spread", "other"),
      allowNull: false,
      defaultValue: "other",
    },
  },
  {
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    tableName: "earnings",
  }
);

// Define associations
Earning.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });

export default Earning;
