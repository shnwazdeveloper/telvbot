const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true },
  title: { type: String, required: true },
  path: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  mediaType: {
    type: String,
    enum: ['text', 'photo', 'video', 'audio', 'document', 'animation', 'sticker', 'voice', 'mixed'],
    default: 'text',
  },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

pageSchema.index({ telegramId: 1, createdAt: -1 });

module.exports = mongoose.model('Page', pageSchema);
