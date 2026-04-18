require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const { connectDB } = require('./services/database');
const { startServer } = require('./services/server');

const { handleStart, handleHelp, handleCancel, handleAccount, handleStats } = require('./handlers/commands');
const { handlePages } = require('./handlers/pages');
const { handleUpload, handleMessage } = require('./handlers/upload');

async function main() {
  // 1. Connect database
  await connectDB();

  // 2. Start HTTP server (Render needs a port to be bound)
  startServer();

  // 3. Initialize bot
  if (!config.bot.token) {
    console.error('[bot] BOT_TOKEN is not set. Please check your .env file.');
    process.exit(1);
  }

  const bot = new TelegramBot(config.bot.token, { polling: true });
  console.log('[bot] started polling');

  // -- Commands --
  bot.onText(/\/start/, (msg) => handleStart(bot, msg));
  bot.onText(/\/help/, (msg) => handleHelp(bot, msg));
  bot.onText(/\/cancel/, (msg) => handleCancel(bot, msg));
  bot.onText(/\/account/, (msg) => handleAccount(bot, msg));
  bot.onText(/\/stats/, (msg) => handleStats(bot, msg));
  bot.onText(/\/pages/, (msg) => handlePages(bot, msg));
  bot.onText(/\/upload/, (msg) => handleUpload(bot, msg));

  // -- Media & text messages (state machine) --
  bot.on('message', async (msg) => {
    // Skip command messages already handled above
    if (msg.text && msg.text.startsWith('/')) return;
    await handleMessage(bot, msg);
  });

  // -- Error handling --
  bot.on('polling_error', (err) => {
    console.error('[bot] polling error:', err.code, err.message);
  });

  bot.on('error', (err) => {
    console.error('[bot] error:', err.message);
  });

  process.on('SIGTERM', () => {
    console.log('[bot] SIGTERM received - shutting down');
    bot.stopPolling();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[main] fatal error:', err);
  process.exit(1);
});
