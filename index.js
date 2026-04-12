const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const { initializeDatabase } = require("./db/db.connect");
const express = require("express");
const app = express();
const cors = require("cors");
initializeDatabase();

const corsOption = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOption));

app.use("/api/categories", require("./routes/categories.js"));
app.use("/api/products", require("./routes/products.js"));
app.use("/api/cart", require("./routes/cart.js"));
app.use("/api/wishlist", require("./routes/wishlist.js"));
app.use("/api/addresses", require("./routes/addresses.js"));
app.use("/api/orders", require("./routes/order.js"));
app.use('/api/ai',require("./routes/aiRoutes.js"))

app.get("/", (req, res) => {
  res.send("Hello, Welcome to express routes.");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
