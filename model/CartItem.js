const mongoose = require("mongoose");
const cartItemSchema = new mongoose.Schema({
  userId: { type: String },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  size: { type: String, default: "" },
  sizes: [{ type: String }],
  qty: { type: Number, default: 1 },
});
module.exports = mongoose.model("CartItem", cartItemSchema);
