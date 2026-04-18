const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  isBlocked: { type: Boolean, default: false },
  totalUploads: { type: Number, default: 0 },
  totalPages: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

userSchema.methods.updateActivity = function () {
  this.lastActiveAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
