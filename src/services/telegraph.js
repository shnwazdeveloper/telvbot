const axios = require('axios');
const FormData = require('form-data');
const config = require('../../config');

const TELEGRAPH_API = config.telegraph.apiUrl;
const ACCESS_TOKEN = config.telegraph.accessToken;

// Telegraph only accepts: image/jpeg, image/png, image/gif, video/mp4
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];

function mimeTypeToExt(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/gif':  'gif',
    'image/webp': 'jpg',   // webp → re-label as jpg (telegraph accepts it)
    'video/mp4':  'mp4',
    'video/webm': 'mp4',   // re-label webm as mp4
    'audio/mpeg': 'mp3',
    'audio/ogg':  'ogg',
    'audio/mp4':  'm4a',
  };
  return map[mimeType] || 'jpg';
}

// Normalize mime for Telegraph's strict whitelist
function normalizeMime(mimeType) {
  if (!mimeType) return 'image/jpeg';
  if (mimeType.startsWith('image/')) return 'image/jpeg';
  if (mimeType.startsWith('video/')) return 'video/mp4';
  return null; // not uploadable to telegraph directly
}

async function uploadFile(fileBuffer, mimeType) {
  const normalized = normalizeMime(mimeType);
  if (!normalized) {
    throw new Error('UNSUPPORTED_MIME:' + mimeType);
  }

  const ext = mimeTypeToExt(mimeType);
  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: `upload.${ext}`,
    contentType: normalized,   // always send normalized mime
  });

  let response;
  try {
    response = await axios.post('https://telegra.ph/upload', form, {
      headers: form.getHeaders(),
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength:    50 * 1024 * 1024,
      timeout: 60000,
    });
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error('Telegraph upload HTTP error: ' + detail);
  }

  if (Array.isArray(response.data) && response.data[0]?.src) {
    return 'https://telegra.ph' + response.data[0].src;
  }
  throw new Error('Telegraph upload bad response: ' + JSON.stringify(response.data));
}

function tagNode(tag, attrs, children) {
  const node = { tag };
  if (attrs && Object.keys(attrs).length) node.attrs = attrs;
  if (children && children.length) node.children = children;
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

function audioNode(telegramFileUrl, label) {
  // Audio cannot be uploaded to Telegraph - embed as a link
  return tagNode('p', {}, [
    tagNode('a', { href: telegramFileUrl }, [label || 'audio file']),
  ]);
}

function documentNode(href, filename) {
  return tagNode('p', {}, [
    tagNode('a', { href }, [filename || 'document']),
  ]);
}

async function createPage(title, content) {
  const payload = {
    access_token: ACCESS_TOKEN,
    title,
    content: JSON.stringify(content),
    return_content: false,
  };
  if (config.telegraph.authorName) payload.author_name = config.telegraph.authorName;
  if (config.telegraph.authorUrl)  payload.author_url  = config.telegraph.authorUrl;

  let res;
  try {
    res = await axios.post(`${TELEGRAPH_API}/createPage`, payload, { timeout: 15000 });
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error('createPage HTTP error: ' + detail);
  }

  if (!res.data.ok) throw new Error('createPage failed: ' + res.data.error);
  return res.data.result;
}

async function getPage(path) {
  const res = await axios.get(`${TELEGRAPH_API}/getPage/${path}`, {
    params: { return_content: false },
    timeout: 10000,
  });
  if (!res.data.ok) throw new Error('getPage failed: ' + res.data.error);
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
  if (!res.data.ok) throw new Error('getAccountInfo failed: ' + res.data.error);
  return res.data.result;
}

async function getPageList(offset = 0, limit = 50) {
  const res = await axios.get(`${TELEGRAPH_API}/getPageList`, {
    params: { access_token: ACCESS_TOKEN, offset, limit },
    timeout: 10000,
  });
  if (!res.data.ok) throw new Error('getPageList failed: ' + res.data.error);
  return res.data.result;
}

module.exports = {
  uploadFile,
  tagNode,
  imageNode,
  videoNode,
  audioNode,
  documentNode,
  createPage,
  getPage,
  getAccountInfo,
  getPageList,
};
