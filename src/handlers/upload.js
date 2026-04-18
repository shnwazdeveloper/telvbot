const { MSGS } = require('../utils/messages');
const { ensureUser } = require('../middlewares/auth');
const { getState, setState, clearSession, getSession } = require('../services/session');
const telegraph = require('../services/telegraph');
const { getFileBuffer, getFilePath, buildTgUrl } = require('../services/downloader');
const Page = require('../models/Page');
const User = require('../models/User');

async function handleUpload(bot, msg) {
  const user = await ensureUser(bot, msg);
  if (!user) return;
  setState(msg.from.id, 'awaiting_title');
  await bot.sendMessage(msg.chat.id, MSGS.askTitle);
}

async function handleMessage(bot, msg) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const state  = getState(userId);
  if (!state) return;

  const user = await ensureUser(bot, msg);
  if (!user) return;

  if (state === 'awaiting_title') {
    if (!msg.text || msg.text.startsWith('/')) {
      return bot.sendMessage(chatId, MSGS.error('ᴘʟᴇᴀsᴇ sᴇɴᴅ ᴀ ᴛᴇxᴛ ᴛɪᴛʟᴇ.'));
    }
    setState(userId, 'awaiting_content', { title: msg.text.trim() });
    return bot.sendMessage(chatId, MSGS.askContent);
  }

  if (state === 'awaiting_content') {
    await processContent(bot, msg, userId, chatId);
  }
}

async function processContent(bot, msg, userId, chatId) {
  const { title } = getSession(userId);
  let content   = [];
  let mediaType = 'text';

  const waitMsg = await bot.sendMessage(chatId, MSGS.uploading);

  try {

    // ── PHOTO ──────────────────────────────────────────────
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1];
      const { buffer } = await getFileBuffer(photo.file_id);
      const url = await telegraph.uploadFile(buffer, 'image/jpeg');
      content.push(telegraph.imageNode(url, msg.caption || ''));
      mediaType = 'photo';
    }

    // ── VIDEO ──────────────────────────────────────────────
    else if (msg.video) {
      const { buffer, fileSize } = await getFileBuffer(msg.video.file_id);
      if (fileSize > 5 * 1024 * 1024) {
        // Too large for Telegraph — link it via Telegram CDN
        const fp  = await getFilePath(msg.video.file_id);
        const url = buildTgUrl(fp);
        content.push(telegraph.videoNode(url, msg.caption || ''));
      } else {
        const url = await telegraph.uploadFile(buffer, 'video/mp4');
        content.push(telegraph.videoNode(url, msg.caption || ''));
      }
      mediaType = 'video';
    }

    // ── ANIMATION / GIF ────────────────────────────────────
    else if (msg.animation) {
      const { buffer, fileSize } = await getFileBuffer(msg.animation.file_id);
      if (fileSize > 5 * 1024 * 1024) {
        const fp  = await getFilePath(msg.animation.file_id);
        content.push(telegraph.videoNode(buildTgUrl(fp), msg.caption || ''));
      } else {
        const url = await telegraph.uploadFile(buffer, 'video/mp4');
        content.push(telegraph.videoNode(url, msg.caption || ''));
      }
      mediaType = 'animation';
    }

    // ── STICKER ────────────────────────────────────────────
    else if (msg.sticker) {
      const fileId = msg.sticker.thumbnail?.file_id || msg.sticker.file_id;
      const { buffer } = await getFileBuffer(fileId);
      const url = await telegraph.uploadFile(buffer, 'image/jpeg');
      content.push(telegraph.imageNode(url, 'sticker'));
      mediaType = 'sticker';
    }

    // ── AUDIO ─────────── link only, Telegraph can't host audio
    else if (msg.audio) {
      const fp  = await getFilePath(msg.audio.file_id);
      const url = buildTgUrl(fp);
      const lbl = msg.audio.title || msg.audio.file_name || 'audio file';
      content.push(telegraph.audioNode(url, lbl));
      if (msg.caption) content.push(telegraph.tagNode('p', {}, [msg.caption]));
      mediaType = 'audio';
    }

    // ── VOICE ─────────── link only
    else if (msg.voice) {
      const fp  = await getFilePath(msg.voice.file_id);
      const url = buildTgUrl(fp);
      content.push(telegraph.audioNode(url, 'voice note'));
      mediaType = 'voice';
    }

    // ── DOCUMENT ───────────────────────────────────────────
    else if (msg.document) {
      const doc  = msg.document;
      const mime = doc.mime_type || 'application/octet-stream';

      if (mime.startsWith('image/')) {
        const { buffer } = await getFileBuffer(doc.file_id);
        const url = await telegraph.uploadFile(buffer, 'image/jpeg');
        content.push(telegraph.imageNode(url, doc.file_name || ''));

      } else if (mime === 'video/mp4' || mime === 'video/webm') {
        const { buffer, fileSize } = await getFileBuffer(doc.file_id);
        if (fileSize > 5 * 1024 * 1024) {
          const fp = await getFilePath(doc.file_id);
          content.push(telegraph.videoNode(buildTgUrl(fp), doc.file_name || ''));
        } else {
          const url = await telegraph.uploadFile(buffer, 'video/mp4');
          content.push(telegraph.videoNode(url, doc.file_name || ''));
        }

      } else {
        // PDF, zip, apk, etc — link via Telegram CDN
        const fp  = await getFilePath(doc.file_id);
        const url = buildTgUrl(fp);
        content.push(telegraph.documentNode(url, doc.file_name || 'document'));
      }

      if (msg.caption) content.push(telegraph.tagNode('p', {}, [msg.caption]));
      mediaType = 'document';
    }

    // ── TEXT ───────────────────────────────────────────────
    else if (msg.text && !msg.text.startsWith('/')) {
      msg.text.split('\n').filter(Boolean).forEach(line => {
        content.push(telegraph.tagNode('p', {}, [line]));
      });
      mediaType = 'text';
    }

    else {
      await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
      return bot.sendMessage(chatId, MSGS.error('ᴜɴsᴜᴘᴘᴏʀᴛᴇᴅ ᴄᴏɴᴛᴇɴᴛ ᴛʏᴘᴇ.'));
    }

    if (!content.length) {
      await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
      return bot.sendMessage(chatId, MSGS.error('ᴄᴏᴜʟᴅ ɴᴏᴛ ʙᴜɪʟᴅ ᴘᴀɢᴇ ᴄᴏɴᴛᴇɴᴛ.'));
    }

    const page = await telegraph.createPage(title, content);

    await Page.create({ telegramId: userId, title, path: page.path, url: page.url, mediaType });
    await User.updateOne({ telegramId: userId }, { $inc: { totalUploads: 1, totalPages: 1 } });

    clearSession(userId);
    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
    await bot.sendMessage(chatId, MSGS.success(title, page.url));

  } catch (err) {
    console.error('[Upload Error]', err.message);
    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
    await bot.sendMessage(chatId, MSGS.error(err.message));
    clearSession(userId);
  }
}

module.exports = { handleUpload, handleMessage };
