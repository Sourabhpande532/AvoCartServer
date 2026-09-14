const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

// Safely configure DNS override for local Windows environment without breaking Vercel serverless containers
try {
  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  }
} catch (e) {
  // Ignore DNS setServers errors in restricted environments
}

let isConnected = false;

const initializeDatabase = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const connectionUrl = process.env.MONGO_URL;
  if (!connectionUrl) {
    console.error("MONGO_URL environment variable is missing!");
    throw new Error("MONGO_URL environment variable is missing");
  }

  try {
    const connection = await mongoose.connect(connectionUrl);
    isConnected = true;
    console.log("Connected to database successfully.");
    return connection;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

module.exports = { initializeDatabase };
