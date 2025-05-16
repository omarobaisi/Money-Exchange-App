import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

/**
 * Database Connection Configuration
 *
 * This file sets up the connection to MySQL database using Sequelize ORM.
 * Configuration includes support for Arabic characters using UTF-8 charset.
 * Automatically creates the database if it doesn't exist.
 */

// Create initial connection without database
const initialConnection = new Sequelize(
  "",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

// Create database if it doesn't exist
const createDatabase = async () => {
  try {
    await initialConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "money_exchange"} 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log("✅ Database created or already exists");
  } catch (error) {
    console.error("❌ Error creating database:", error);
    throw error;
  }
};

// Main database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || "money_exchange",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Adding support for Arabic characters
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
  }
);

export { createDatabase };
export default sequelize;
