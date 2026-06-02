const express = require("express");
const app = express.Router();
const CartItem = require("../model/CartItem");
const verifyToken = require("../middleware/verifyToken");

app.use(verifyToken);

// GET CART ITEMS FOR USER
app.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await CartItem.find({ userId }).populate("product");
    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: { cart: items },
    });
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch cart", error: error.message });
  }
});

// ADD ITEM TO CART
app.post("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, qty = 1, size = "" } = req.body;

    if (!productId)
      return res.status(400).json({ success: false, message: "productId is required" });

    let item = await CartItem.findOne({ userId, product: productId, size });
    if (item) {
      item.qty += Number(qty);
      await item.save();
    } else {
      item = await CartItem.create({ userId, product: productId, qty: Number(qty), size });
    }
    const items = await CartItem.find({ userId }).populate("product");
    return res.status(200).json({ success: true, message: "Item added to cart", data: { cart: items } });
  } catch (error) {
    console.error("Error adding item to cart:", error.message);
    return res.status(500).json({ success: false, message: "Failed to add item to cart", error: error.message });
  }
});

// UPDATE CART ITEM QTY
app.put("/:id", async (req, res) => {
  try {
    const { qty } = req.body;
    if (qty === undefined)
      return res.status(400).json({ success: false, message: "qty is required" });

    const item = await CartItem.findById(req.params.id);
    if (!item)
      return res.status(404).json({ success: false, message: "Cart item not found" });

    item.qty = qty;
    await item.save();
    return res.status(200).json({ success: true, message: "Cart item updated successfully", data: { item } });
  } catch (error) {
    console.error("Error updating cart item:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update cart item", error: error.message });
  }
});

// DELETE CART ITEM
app.delete("/:id", async (req, res) => {
  try {
    const cartItem = await CartItem.findByIdAndDelete(req.params.id);
    if (!cartItem)
      return res.status(404).json({ success: false, message: "Cart item not found" });

    res.status(200).json({ success: true, message: "Cart item deleted", cart: cartItem });
  } catch (error) {
    console.error("Error deleting cart item:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete cart item", error: error.message });
  }
});

module.exports = app;