const express = require("express");
const app = express.Router();
const WishlistItem = require("../model/WishlistItem");
const verifyToken = require("../middleware/verifyToken");

app.use(verifyToken);

// GET WISHLIST ITEMS
app.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await WishlistItem.find({ userId }).populate("product");
    res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: { wishlist: items },
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch wishlist", error: error.message });
  }
});

// ADD ITEM TO WISHLIST
app.post("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    if (!productId)
      return res.status(400).json({ success: false, message: "productId is required" });

    const exists = await WishlistItem.findOne({ userId, product: productId });
    if (exists) {
      const items = await WishlistItem.find({ userId }).populate("product");
      return res.status(200).json({ success: true, message: "Item already exists in wishlist", data: { wishlist: items } });
    }
    await WishlistItem.create({ userId, product: productId });
    const items = await WishlistItem.find({ userId }).populate("product");
    return res.status(200).json({ success: true, message: "Item added to wishlist", data: { wishlist: items } });
  } catch (error) {
    console.error("Error adding wishlist item:", error.message);
    return res.status(500).json({ success: false, message: "Failed to add item to wishlist", error: error.message });
  }
});

// DELETE ITEM FROM WISHLIST
app.delete("/:id", async (req, res) => {
  try {
    const deleted = await WishlistItem.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Wishlist item not found" });

    return res.status(200).json({ success: true, message: "Wishlist item deleted", data: { deleted } });
  } catch (error) {
    console.error("Error deleting wishlist item:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete wishlist item", error: error.message });
  }
});

module.exports = app;