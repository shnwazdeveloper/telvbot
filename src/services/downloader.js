const axios = require('axios');
const config = require('../../config');

const TG_API  = `https://api.telegram.org/bot${config.bot.token}`;
const TG_FILE = `https://api.telegram.org/file/bot${config.bot.token}`;

// Returns { buffer, filePath, fileSize }
async function getFileBuffer(fileId) {
  const info = await axios.get(`${TG_API}/getFile`, {
    params: { file_id: fileId },
    timeout: 10000,
  });
  if (!info.data.ok) throw new Error('getFile failed: ' + JSON.stringify(info.data));

  const filePath = info.data.result.file_path;
  const fileUrl  = `${TG_FILE}/${filePath}`;

  const response = await axios.get(fileUrl, {
    responseType: 'arraybuffer',
    maxContentLength: 50 * 1024 * 1024,
    maxBodyLength:    50 * 1024 * 1024,
    timeout: 60000,
  });

  const buffer = Buffer.from(response.data);
  return { buffer, filePath, fileSize: buffer.length };
}

// Get only the filePath (for audio/voice/docs that link out)
async function getFilePath(fileId) {
  const info = await axios.get(`${TG_API}/getFile`, {
    params: { file_id: fileId },
    timeout: 10000,
  });
  if (!info.data.ok) throw new Error('getFile failed: ' + JSON.stringify(info.data));
  return info.data.result.file_path;
}

function buildTgUrl(filePath) {
  return `${TG_FILE}/${filePath}`;
}

module.exports = { getFileBuffer, getFilePath, buildTgUrl };
