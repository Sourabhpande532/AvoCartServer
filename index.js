require('dotenv').config();
const { initializeDatabase } = require("./db/db.connect");
const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://avo-cart-client.vercel.app"
].filter(Boolean);

const corsOption = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      return origin === allowed || origin.replace(/\/$/, "") === allowed.replace(/\/$/, "");
    }) || origin.endsWith(".vercel.app");

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOption));

// Database connection middleware for serverless invocations
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed. Please verify MONGO_URL configuration.",
      error: err.message
    });
  }
});

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || "fallback_jwt_secret",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());

// Routes
app.use("/auth", require("./routes/auth.js"));
app.use("/api/categories", require("./routes/categories.js"));
app.use("/api/products", require("./routes/products.js"));
app.use("/api/cart", require("./routes/cart.js"));
app.use("/api/wishlist", require("./routes/wishlist.js"));
app.use("/api/addresses", require("./routes/addresses.js"));
app.use("/api/orders", require("./routes/order.js"));
app.use('/api/ai', require("./routes/aiRoutes.js"));

app.get("/", (req, res) => {
  res.send("Hello, Welcome to express routes.");
});

// Export app for Vercel Serverless Function deployment
module.exports = app;

// Listen locally if invoked directly
if (require.main === module || !process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`The server is running on http://localhost:${PORT}`);
  });
}
