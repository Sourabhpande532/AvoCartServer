const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String },
  password: { type: String },
  googleId: { type: String },
  githubId: { type: String },
  avatar: { type: String },
  provider: { type: String, default: 'local' },
  isGuest: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);