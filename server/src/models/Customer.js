/**
 * Customer Model
 *
 * Represents customers in the money exchange system.
 * Supports Arabic names through utf8mb4 encoding.
 * Star field allows marking favorite/frequent customers.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Customer = sequelize.define(
  "Customer",
  {
    _id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "_id",
    },
    name: {
      type: DataTypes.STRING(100), // Increased to accommodate longer names
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    star: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "customer",
    timestamps: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  }
);

export default Customer;
