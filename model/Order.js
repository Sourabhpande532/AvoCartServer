const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  userId: { type: String },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number }],
  total: Number,
  address: Object,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Order', orderSchema);