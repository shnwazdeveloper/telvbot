const fetch    = require('node-fetch');
const FormData = require('form-data');
const axios    = require('axios');
const config   = require('../../config');

const TELEGRAPH_API  = config.telegraph.apiUrl;
const ACCESS_TOKEN   = config.telegraph.accessToken;

// Telegraph only accepts these exact mime types on /upload
// Everything else must be linked, not uploaded
const UPLOADABLE = {
  'image/jpeg': { ext: 'jpg',  mime: 'image/jpeg' },
  'image/png':  { ext: 'png',  mime: 'image/png'  },
  'image/gif':  { ext: 'gif',  mime: 'image/gif'  },
  'image/webp': { ext: 'jpg',  mime: 'image/jpeg' }, // re-label
  'video/mp4':  { ext: 'mp4',  mime: 'video/mp4'  },
  'video/webm': { ext: 'mp4',  mime: 'video/mp4'  }, // re-label
};

function canUpload(mimeType) {
  return !!(UPLOADABLE[mimeType]);
}

// Core upload — uses node-fetch to stream form-data correctly
async function uploadFile(fileBuffer, mimeType) {
  const spec = UPLOADABLE[mimeType];
  if (!spec) {
    throw new Error(`ᴛᴇʟᴇɢʀᴀᴘʜ ᴅᴏᴇs ɴᴏᴛ sᴜᴘᴘᴏʀᴛ ᴜᴘʟᴏᴀᴅɪɴɢ: ${mimeType}`);
  }

  // 5 MB hard limit on Telegraph /upload
  const MAX = 5 * 1024 * 1024;
  if (fileBuffer.length > MAX) {
    throw new Error(`ғɪʟᴇ ᴛᴏᴏ ʟᴀʀɢᴇ ғᴏʀ ᴛᴇʟᴇɢʀᴀᴘʜ (ᴍᴀx 5 ᴍʙ). sɪᴢᴇ: ${(fileBuffer.length/1024/1024).toFixed(1)} ᴍʙ`);
  }

  const form = new FormData();
  form.append('file', fileBuffer, {
    filename:    `file.${spec.ext}`,
    contentType: spec.mime,
    knownLength: fileBuffer.length,
  });

  const res = await fetch('https://telegra.ph/upload', {
    method:  'POST',
    body:    form,
    headers: form.getHeaders(),
    timeout: 30000,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Telegraph /upload ${res.status}: ${text}`);
  }

  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error('Telegraph /upload bad JSON: ' + text);
  }

  if (json.error) throw new Error('Telegraph /upload error: ' + json.error);

  if (Array.isArray(json) && json[0]?.src) {
    return 'https://telegra.ph' + json[0].src;
  }

  throw new Error('Telegraph /upload unexpected response: ' + text);
}

// ── Content node builders ─────────────────────────────────

function tagNode(tag, attrs, children) {
  const node = { tag };
  if (attrs  && Object.keys(attrs).length)    node.attrs    = attrs;
  if (children && children.length)             node.children = children;
  return node;
}

function imageNode(src, caption) {
  const fig = { tag: 'figure', children: [{ tag: 'img', attrs: { src } }] };
  if (caption) fig.children.push({ tag: 'figcaption', children: [caption] });
  return fig;
}

function videoNode(src, caption) {
  const fig = { tag: 'figure', children: [{ tag: 'video', attrs: { src } }] };
  if (caption) fig.children.push({ tag: 'figcaption', children: [caption] });
  return fig;
}

// Audio/docs can't be hosted on Telegraph — embed as hyperlink
function audioNode(href, label) {
  return tagNode('p', {}, [
    tagNode('a', { href }, [`[ ${label || 'audio'} ]`]),
  ]);
}

function documentNode(href, filename) {
  return tagNode('p', {}, [
    tagNode('a', { href }, [filename || 'document']),
  ]);
}

// ── Telegraph API calls ───────────────────────────────────

async function createPage(title, content) {
  const payload = {
    access_token:   ACCESS_TOKEN,
    title:          title.slice(0, 256),   // Telegraph max title length
    content:        JSON.stringify(content),
    return_content: false,
  };
  if (config.telegraph.authorName) payload.author_name = config.telegraph.authorName;
  if (config.telegraph.authorUrl)  payload.author_url  = config.telegraph.authorUrl;

  let res;
  try {
    res = await axios.post(`${TELEGRAPH_API}/createPage`, payload, { timeout: 15000 });
  } catch (err) {
    throw new Error('createPage: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
  }

  if (!res.data.ok) throw new Error('createPage: ' + res.data.error);
  return res.data.result;
}

async function getAccountInfo() {
  const res = await axios.get(`${TELEGRAPH_API}/getAccountInfo`, {
    params: {
      access_token: ACCESS_TOKEN,
      fields: JSON.stringify(['short_name','author_name','author_url','auth_url','page_count']),
    },
    timeout: 10000,
  });
  if (!res.data.ok) throw new Error('getAccountInfo: ' + res.data.error);
  return res.data.result;
}

async function getPageList(offset = 0, limit = 50) {
  const res = await axios.get(`${TELEGRAPH_API}/getPageList`, {
    params: { access_token: ACCESS_TOKEN, offset, limit },
    timeout: 10000,
  });
  if (!res.data.ok) throw new Error('getPageList: ' + res.data.error);
  return res.data.result;
}

module.exports = {
  uploadFile,
  canUpload,
  tagNode,
  imageNode,
  videoNode,
  audioNode,
  documentNode,
  createPage,
  getAccountInfo,
  getPageList,
};
