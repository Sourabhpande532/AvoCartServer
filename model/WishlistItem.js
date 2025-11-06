const mongoose = require('mongoose');
const wishlistSchema = new mongoose.Schema({
  userId: { type: String },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
});
module.exports = mongoose.model('WishlistItem', wishlistSchema);