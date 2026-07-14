require('dotenv').config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { initializeDatabase } = require("./db/db.connect");
const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");

initializeDatabase();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://avo-cart-client.vercel.app"
];

const corsOption = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOption));

// Session (required by passport even in stateless JWT mode)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
