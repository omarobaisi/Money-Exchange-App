/**
 * MyCurrency Model
 *
 * Represents the company's currency balances.
 * Maintains separate cash and check balances for each currency.
 * Star field indicates favorite/primary currencies.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Currency from "./Currency.js";

const MyCurrency = sequelize.define(
  "MyCurrency",
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
    tableName: "my_currency",
    timestamps: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  }
);

// Define the relationship
MyCurrency.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });

export default MyCurrency;
