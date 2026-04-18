const { MSGS } = require('../utils/messages');
const { ensureUser } = require('../middlewares/auth');
const { getState, setState, clearSession } = require('../services/session');
const telegraph = require('../services/telegraph');
const { getFileBuffer, inferMimeType } = require('../services/downloader');
const Page = require('../models/Page');
const User = require('../models/User');

// /upload command - initiate upload flow
async function handleUpload(bot, msg) {
  const user = await ensureUser(bot, msg);
  if (!user) return;
  setState(msg.from.id, 'awaiting_title');
  await bot.sendMessage(msg.chat.id, MSGS.askTitle);
}

// Main message router - handles state-based flow
async function handleMessage(bot, msg) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const state = getState(userId);

  if (!state) return; // no active session, ignore

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
    await processContent(bot, msg, userId, chatId, user);
  }
}

async function processContent(bot, msg, userId, chatId, user) {
  const { title } = require('../services/session').getSession(userId);
  let content = [];
  let mediaType = 'text';

  const waitMsg = await bot.sendMessage(chatId, MSGS.uploading);

  try {
    // ---- PHOTO ----
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1];
      const { buffer } = await getFileBuffer(photo.file_id);
      const url = await telegraph.uploadFile(buffer, 'image/jpeg');
      const caption = msg.caption || '';
      content.push(telegraph.imageNode(url, caption));
      if (caption) content.push(telegraph.tagNode('p', {}, [caption]));
      mediaType = 'photo';
    }

    // ---- VIDEO ----
    else if (msg.video) {
      const { buffer } = await getFileBuffer(msg.video.file_id);
      const mime = msg.video.mime_type || 'video/mp4';
      const url = await telegraph.uploadFile(buffer, mime);
      const caption = msg.caption || '';
      content.push(telegraph.videoNode(url, caption));
      if (caption) content.push(telegraph.tagNode('p', {}, [caption]));
      mediaType = 'video';
    }

    // ---- ANIMATION / GIF ----
    else if (msg.animation) {
      const { buffer } = await getFileBuffer(msg.animation.file_id);
      const mime = msg.animation.mime_type || 'video/mp4';
      const url = await telegraph.uploadFile(buffer, mime);
      content.push(telegraph.videoNode(url, msg.caption || ''));
      mediaType = 'animation';
    }

    // ---- STICKER (webp treated as image) ----
    else if (msg.sticker) {
      const fileId = msg.sticker.thumbnail?.file_id || msg.sticker.file_id;
      const { buffer } = await getFileBuffer(fileId);
      const url = await telegraph.uploadFile(buffer, 'image/webp');
      content.push(telegraph.imageNode(url, 'sticker'));
      mediaType = 'sticker';
    }

    // ---- AUDIO ----
    else if (msg.audio) {
      const { buffer, filePath } = await getFileBuffer(msg.audio.file_id);
      const mime = msg.audio.mime_type || inferMimeType(filePath, null);
      const url = await telegraph.uploadFile(buffer, mime);
      const label = msg.audio.title || msg.audio.file_name || 'audio';
      content.push(telegraph.audioNode(url, label));
      if (msg.caption) content.push(telegraph.tagNode('p', {}, [msg.caption]));
      mediaType = 'audio';
    }

    // ---- VOICE ----
    else if (msg.voice) {
      const { buffer } = await getFileBuffer(msg.voice.file_id);
      const url = await telegraph.uploadFile(buffer, 'audio/ogg');
      content.push(telegraph.audioNode(url, 'voice note'));
      mediaType = 'voice';
    }

    // ---- DOCUMENT ----
    else if (msg.document) {
      const doc = msg.document;
      const { buffer, filePath } = await getFileBuffer(doc.file_id);
      const mime = doc.mime_type || inferMimeType(filePath, null);
      const isImage = mime.startsWith('image/');
      const isVideo = mime.startsWith('video/');

      if (isImage) {
        const url = await telegraph.uploadFile(buffer, mime);
        content.push(telegraph.imageNode(url, doc.file_name || 'image'));
      } else if (isVideo) {
        const url = await telegraph.uploadFile(buffer, mime);
        content.push(telegraph.videoNode(url, doc.file_name || 'video'));
      } else {
        // Non-uploadable to telegraph (PDF etc.) - link via telegra.ph upload attempt
        try {
          const url = await telegraph.uploadFile(buffer, mime);
          content.push(telegraph.documentNode(url, doc.file_name || 'document'));
        } catch {
          content.push(telegraph.tagNode('p', {}, [`[ ${doc.file_name || 'document'} - ᴅɪʀᴇᴄᴛ ᴜᴘʟᴏᴀᴅ ɴᴏᴛ sᴜᴘᴘᴏʀᴛᴇᴅ ]`]));
        }
      }
      if (msg.caption) content.push(telegraph.tagNode('p', {}, [msg.caption]));
      mediaType = 'document';
    }

    // ---- TEXT ----
    else if (msg.text && !msg.text.startsWith('/')) {
      const paragraphs = msg.text.split('\n').filter(Boolean);
      paragraphs.forEach(p => content.push(telegraph.tagNode('p', {}, [p])));
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

    // Create Telegraph page
    const page = await telegraph.createPage(title, content);

    // Save to DB
    await Page.create({
      telegramId: userId,
      title,
      path: page.path,
      url: page.url,
      mediaType,
    });

    // Update user stats
    await User.updateOne(
      { telegramId: userId },
      { $inc: { totalUploads: 1, totalPages: 1 } }
    );

    clearSession(userId);
    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
    await bot.sendMessage(chatId, MSGS.success(title, page.url), {
      disable_web_page_preview: false,
    });

  } catch (err) {
    console.error('[Upload Error]', err.message);
    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
    await bot.sendMessage(chatId, MSGS.error(err.message));
    clearSession(userId);
  }
}

module.exports = { handleUpload, handleMessage };
