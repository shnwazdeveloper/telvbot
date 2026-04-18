const axios = require('axios');
const config = require('../../config');

const TG_API = `https://api.telegram.org/bot${config.bot.token}`;
const TG_FILE = `https://api.telegram.org/file/bot${config.bot.token}`;

async function getFileBuffer(fileId) {
  // Step 1: get file path
  const info = await axios.get(`${TG_API}/getFile`, { params: { file_id: fileId } });
  if (!info.data.ok) throw new Error('getFile failed: ' + JSON.stringify(info.data));
  const filePath = info.data.result.file_path;

  // Step 2: download file
  const fileUrl = `${TG_FILE}/${filePath}`;
  const response = await axios.get(fileUrl, {
    responseType: 'arraybuffer',
    maxContentLength: 50 * 1024 * 1024,
  });
  return { buffer: Buffer.from(response.data), filePath };
}

function inferMimeType(filePath, mimeTypeHint) {
  if (mimeTypeHint) return mimeTypeHint;
  const ext = filePath.split('.').pop().toLowerCase();
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp',
    mp4: 'video/mp4', webm: 'video/webm',
    mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4',
    pdf: 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}

module.exports = { getFileBuffer, inferMimeType };
