const express = require("express");
const app = express.Router();
const Address = require("../model/Address.js");
const verifyToken = require("../middleware/verifyToken");

app.use(verifyToken);

// GET ADDRESSES
app.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const addresses = await Address.find({ userId });
    return res.status(200).json({ success: true, message: "Addresses fetched successfully", data: { addresses } });
  } catch (error) {
    console.error("Error fetching addresses:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch addresses", error: error.message });
  }
});

// CREATE ADDRESS
app.post("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const addr = await Address.create({ ...req.body, userId });
    const addresses = await Address.find({ userId });
    return res.status(200).json({ success: true, message: "Address added successfully", data: { addresses } });
  } catch (error) {
    console.error("Error creating address:", error.message);
    return res.status(400).json({ success: false, message: "Failed to create address", error: error.message });
  }
});

// UPDATE ADDRESS
app.put("/:id", async (req, res) => {
  try {
    const addr = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!addr)
      return res.status(404).json({ success: false, message: "Address not found" });
    return res.status(200).json({ success: true, message: "Address updated successfully", data: { address: addr } });
  } catch (error) {
    console.error("Error updating address:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update address", error: error.message });
  }
});

// DELETE ADDRESS
app.delete("/:id", async (req, res) => {
  try {
    const deleted = await Address.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Address not found" });
    return res.status(200).json({ success: true, message: "Address deleted successfully", data: { deleted } });
  } catch (error) {
    console.error("Error deleting address:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete address", error: error.message });
  }
});

module.exports = app;
