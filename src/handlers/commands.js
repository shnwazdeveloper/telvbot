const { MSGS } = require('../utils/messages');
const { ensureUser } = require('../middlewares/auth');
const { clearSession } = require('../services/session');
const { getAccountInfo } = require('../services/telegraph');
const Page = require('../models/Page');

async function handleStart(bot, msg) {
  const user = await ensureUser(bot, msg);
  if (!user) return;
  const name = msg.from.first_name || 'user';
  await bot.sendMessage(msg.chat.id, MSGS.welcome(name), { parse_mode: 'HTML' });
}

async function handleHelp(bot, msg) {
  const user = await ensureUser(bot, msg);
  if (!user) return;
  await bot.sendMessage(msg.chat.id, MSGS.help, { parse_mode: 'HTML' });
}

async function handleCancel(bot, msg) {
  const user = await ensureUser(bot, msg);
  if (!user) return;
  clearSession(msg.from.id);
  await bot.sendMessage(msg.chat.id, MSGS.cancelled);
}

async function handleAccount(bot, msg) {
  const user = await ensureUser(bot, msg);
  if (!user) return;
  try {
    const info = await getAccountInfo();
    await bot.sendMessage(msg.chat.id, MSGS.account(info));
  } catch (e) {
    await bot.sendMessage(msg.chat.id, MSGS.error(e.message));
  }
}

async function handleStats(bot, msg) {
  const user = await ensureUser(bot, msg);
  if (!user) return;
  const pageCount = await Page.countDocuments({ telegramId: msg.from.id });
  await bot.sendMessage(msg.chat.id, MSGS.stats(user, pageCount));
}

module.exports = { handleStart, handleHelp, handleCancel, handleAccount, handleStats };
