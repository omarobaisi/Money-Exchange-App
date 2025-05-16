/**
 * Currency Model
 *
 * Represents the available currencies in the system.
 * Supports Arabic text through utf8mb4 encoding.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Currency = sequelize.define(
  "Currency",
  {
    _id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "_id",
    },
    currency: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    tableName: "currency",
    timestamps: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  }
);

export default Currency;
