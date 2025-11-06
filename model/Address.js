const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
  userId: { type: String },
  name: String,
  street: String,
  city: String,
  state: String,
  zip: String,
  phone: String,
  isDefault: { type: Boolean, default: false }
});
module.exports = mongoose.model('Address', addressSchema);
