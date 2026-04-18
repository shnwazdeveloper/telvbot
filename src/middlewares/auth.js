const User = require('../models/User');
const { MSGS } = require('../utils/messages');

async function ensureUser(bot, msg) {
  const tgUser = msg.from;
  let user = await User.findOne({ telegramId: tgUser.id });

  if (!user) {
    user = await User.create({
      telegramId: tgUser.id,
      username: tgUser.username || '',
      firstName: tgUser.first_name || '',
      lastName: tgUser.last_name || '',
    });
  } else {
    await user.updateActivity();
  }

  if (user.isBlocked) {
    await bot.sendMessage(msg.chat.id, MSGS.blocked, { parse_mode: 'HTML' });
    return null;
  }

  return user;
}

module.exports = { ensureUser };
