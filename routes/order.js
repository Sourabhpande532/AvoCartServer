const express = require("express");
const app = express.Router();
const Order = require("../model/Order");
const CartItem = require("../model/CartItem");
const verifyToken = require("../middleware/verifyToken");

app.use(verifyToken);

// GET ORDERS FOR USER
app.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ userId }).populate("items.product");
    return res.status(200).json({ success: true, message: "Orders fetched successfully", data: { orders } });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch orders", error: error.message });
  }
});

// CREATE ORDER
app.post("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items, total, address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: "items is required and should be a non-empty array" });
    if (total === undefined)
      return res.status(400).json({ success: false, message: "total is required" });

    const order = await Order.create({ userId, items, total, address });
    await CartItem.deleteMany({ userId });

    return res.status(200).json({ success: true, message: "Order created successfully", data: { order } });
  } catch (error) {
    console.error("Error creating order:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
  }
});

// DELETE ORDER
app.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Order not found" });
    return res.status(200).json({ success: true, message: "Order deleted successfully", data: { deleted } });
  } catch (error) {
    console.error("Error deleting order:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete order", error: error.message });
  }
});

module.exports = app;