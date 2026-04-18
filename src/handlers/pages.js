const { MSGS, line, toSmallCaps } = require('../utils/messages');
const { ensureUser } = require('../middlewares/auth');
const Page = require('../models/Page');

async function handlePages(bot, msg) {
  const user = await ensureUser(bot, msg);
  if (!user) return;

  const pages = await Page.find({ telegramId: msg.from.id }).sort({ createdAt: -1 }).limit(10);
  if (!pages.length) {
    return bot.sendMessage(msg.chat.id, MSGS.noPages);
  }

  const header = `${toSmallCaps('your pages')}\n${line}`;
  const items = pages.map((p, i) => {
    const date = p.createdAt.toLocaleDateString();
    return `${i + 1}. ${p.title}\n   ᴛʏᴘᴇ: ${p.mediaType} | ${date}\n   ${p.url}`;
  }).join('\n\n');

  const footer = pages.length === 10 ? `\n${line}\nsʜᴏᴡɪɴɢ ʟᴀsᴛ 10 ᴘᴀɢᴇs` : '';

  await bot.sendMessage(msg.chat.id, `${header}\n\n${items}${footer}`, {
    disable_web_page_preview: true,
  });
}

module.exports = { handlePages };
