const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  images: [String],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  countInStock: { type: Number, default: 0 }
});
module.exports = mongoose.model("Product", productSchema);