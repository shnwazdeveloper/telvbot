const mongoose = require('mongoose');
const config = require('../../config');

async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[db] connected to mongodb');
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[db] error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected - attempting reconnect');
    setTimeout(connectDB, 5000);
  });
}

module.exports = { connectDB };
