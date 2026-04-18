// Unicode small caps / monospace text helpers
// All bot messages use plain unicode - no emojis

const toSmallCaps = (text) => {
  const map = {
    a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',
    k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'Q',r:'ʀ',s:'s',t:'ᴛ',
    u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ',
  };
  return text.split('').map(c => map[c.toLowerCase()] || c).join('');
};

const line = '─────────────────────';

const MSGS = {
  welcome: (name) =>
`${toSmallCaps('telegraph bot')}
${line}
ᴡᴇʟᴄᴏᴍᴇ, ${name}.

ᴜsᴇ ᴛʜɪs ʙᴏᴛ ᴛᴏ ᴜᴘʟᴏᴀᴅ ᴍᴇᴅɪᴀ ᴀɴᴅ ᴄʀᴇᴀᴛᴇ ᴛᴇʟᴇɢʀᴀᴘʜ ᴘᴀɢᴇs.

/upload   - ᴄʀᴇᴀᴛᴇ ᴀ ɴᴇᴡ ᴘᴀɢᴇ
/pages    - ʟɪsᴛ ʏᴏᴜʀ ᴘᴀɢᴇs
/account  - ᴠɪᴇᴡ ᴀᴄᴄᴏᴜɴᴛ ɪɴғᴏ
/help     - sʜᴏᴡ ᴄᴏᴍᴍᴀɴᴅs
/cancel   - ᴄᴀɴᴄᴇʟ ᴄᴜʀʀᴇɴᴛ ᴏᴘᴇʀᴀᴛɪᴏɴ`,

  help: `${toSmallCaps('commands')}
${line}
/upload   ᴄʀᴇᴀᴛᴇ ᴀ ɴᴇᴡ ᴛᴇʟᴇɢʀᴀᴘʜ ᴘᴀɢᴇ
/pages    ᴠɪᴇᴡ ʏᴏᴜʀ sᴀᴠᴇᴅ ᴘᴀɢᴇs
/account  ᴛᴇʟᴇɢʀᴀᴘʜ ᴀᴄᴄᴏᴜɴᴛ ɪɴғᴏ
/stats    ʏᴏᴜʀ ᴜsᴀɢᴇ sᴛᴀᴛɪsᴛɪᴄs
/cancel   ᴄᴀɴᴄᴇʟ ᴄᴜʀʀᴇɴᴛ ᴀᴄᴛɪᴏɴ
/help     sʜᴏᴡ ᴛʜɪs ᴍᴇssᴀɢᴇ

${toSmallCaps('supported media')}
${line}
- ᴘʜᴏᴛᴏs (ᴊᴘɢ, ᴘɴɢ, ᴡᴇʙᴘ)
- ᴠɪᴅᴇᴏs (ᴍᴘ4)
- ᴀɴɪᴍᴀᴛɪᴏɴs / ɢɪғs
- ᴅᴏᴄᴜᴍᴇɴᴛs
- ᴀᴜᴅɪᴏ ғɪʟᴇs
- ᴠᴏɪᴄᴇ ɴᴏᴛᴇs
- sᴛɪᴄᴋᴇʀs
- ᴛᴇxᴛ ᴄᴏɴᴛᴇɴᴛ`,

  askTitle: `${toSmallCaps('step 1 of 2')}
${line}
sᴇɴᴅ ᴛʜᴇ ᴛɪᴛʟᴇ ғᴏʀ ʏᴏᴜʀ ᴘᴀɢᴇ.`,

  askContent: `${toSmallCaps('step 2 of 2')}
${line}
sᴇɴᴅ ᴛʜᴇ ᴄᴏɴᴛᴇɴᴛ ᴛᴏ ᴜᴘʟᴏᴀᴅ.
ʏᴏᴜ ᴄᴀɴ sᴇɴᴅ:
  - ᴛᴇxᴛ
  - ᴘʜᴏᴛᴏ / ᴠɪᴅᴇᴏ / ᴀᴜᴅɪᴏ
  - ᴅᴏᴄᴜᴍᴇɴᴛ / sᴛɪᴄᴋᴇʀ
  - ᴀɴɪᴍᴀᴛɪᴏɴ / ᴠᴏɪᴄᴇ`,

  uploading: `${toSmallCaps('uploading')}
${line}
ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ...`,

  success: (title, url) =>
`${toSmallCaps('page created')}
${line}
ᴛɪᴛʟᴇ : ${title}
ᴜʀʟ   : ${url}`,

  cancelled: `${toSmallCaps('cancelled')}
${line}
ᴏᴘᴇʀᴀᴛɪᴏɴ ᴄᴀɴᴄᴇʟʟᴇᴅ.`,

  noPages: `${toSmallCaps('no pages')}
${line}
ʏᴏᴜ ʜᴀᴠᴇ ɴᴏ sᴀᴠᴇᴅ ᴘᴀɢᴇs ʏᴇᴛ.
ᴜsᴇ /upload ᴛᴏ ᴄʀᴇᴀᴛᴇ ᴏɴᴇ.`,

  error: (msg) =>
`${toSmallCaps('error')}
${line}
${msg}`,

  blocked: `${toSmallCaps('access denied')}
${line}
ʏᴏᴜ ᴀʀᴇ ʙʟᴏᴄᴋᴇᴅ ғʀᴏᴍ ᴜsɪɴɢ ᴛʜɪs ʙᴏᴛ.`,

  account: (info) =>
`${toSmallCaps('account info')}
${line}
ɴᴀᴍᴇ       : ${info.short_name || '-'}
ᴀᴜᴛʜᴏʀ    : ${info.author_name || '-'}
ᴘᴀɢᴇs      : ${info.page_count || 0}`,

  stats: (user, pages) =>
`${toSmallCaps('your stats')}
${line}
ᴛᴏᴛᴀʟ ᴘᴀɢᴇs   : ${pages}
ᴛᴏᴛᴀʟ ᴜᴘʟᴏᴀᴅs : ${user.totalUploads}
ᴍᴇᴍʙᴇʀ sɪɴᴄᴇ  : ${user.createdAt.toDateString()}`,
};

module.exports = { MSGS, toSmallCaps, line };
