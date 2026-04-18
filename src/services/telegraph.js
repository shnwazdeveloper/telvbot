const axios = require('axios');
const FormData = require('form-data');
const config = require('../../config');

const TELEGRAPH_API = config.telegraph.apiUrl;
const ACCESS_TOKEN = config.telegraph.accessToken;

// Upload a file buffer to Telegraph's file upload endpoint
async function uploadFile(fileBuffer, mimeType) {
  const form = new FormData();
  const ext = mimeTypeToExt(mimeType);
  form.append('file', fileBuffer, { filename: `upload.${ext}`, contentType: mimeType });

  const response = await axios.post('https://telegra.ph/upload', form, {
    headers: form.getHeaders(),
    maxContentLength: 50 * 1024 * 1024,
    maxBodyLength: 50 * 1024 * 1024,
  });

  if (response.data && Array.isArray(response.data) && response.data[0]?.src) {
    return `https://telegra.ph${response.data[0].src}`;
  }
  throw new Error('Telegraph file upload failed: ' + JSON.stringify(response.data));
}

function mimeTypeToExt(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
  };
  return map[mimeType] || 'bin';
}

// Build Telegraph content nodes
function buildContent(nodes) {
  return nodes;
}

function textNode(text) {
  return text;
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

function audioNode(src, caption) {
  const nodes = [
    tagNode('p', {}, [tagNode('a', { href: src }, ['[ audio file ]'])]),
  ];
  if (caption) nodes.push(tagNode('p', {}, [caption]));
  return tagNode('blockquote', {}, nodes);
}

function documentNode(src, filename) {
  return tagNode('p', {}, [tagNode('a', { href: src }, [filename || 'document'])]);
}

// Create a Telegraph page
async function createPage(title, content) {
  const payload = {
    access_token: ACCESS_TOKEN,
    title,
    content: JSON.stringify(content),
    return_content: false,
  };
  if (config.telegraph.authorName) payload.author_name = config.telegraph.authorName;
  if (config.telegraph.authorUrl) payload.author_url = config.telegraph.authorUrl;

  const res = await axios.post(`${TELEGRAPH_API}/createPage`, payload);
  if (!res.data.ok) throw new Error('Failed to create page: ' + res.data.error);
  return res.data.result;
}

// Get page info from Telegraph
async function getPage(path) {
  const res = await axios.get(`${TELEGRAPH_API}/getPage/${path}`, {
    params: { return_content: false },
  });
  if (!res.data.ok) throw new Error('Failed to get page: ' + res.data.error);
  return res.data.result;
}

// Get account info
async function getAccountInfo() {
  const res = await axios.get(`${TELEGRAPH_API}/getAccountInfo`, {
    params: {
      access_token: ACCESS_TOKEN,
      fields: JSON.stringify(['short_name', 'author_name', 'author_url', 'auth_url', 'page_count']),
    },
  });
  if (!res.data.ok) throw new Error('Failed to get account info: ' + res.data.error);
  return res.data.result;
}

// Get page list
async function getPageList(offset = 0, limit = 50) {
  const res = await axios.get(`${TELEGRAPH_API}/getPageList`, {
    params: { access_token: ACCESS_TOKEN, offset, limit },
  });
  if (!res.data.ok) throw new Error('Failed to get page list: ' + res.data.error);
  return res.data.result;
}

module.exports = {
  uploadFile,
  buildContent,
  textNode,
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
