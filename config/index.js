require('dotenv').config();

module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
    adminIds: (process.env.ADMIN_IDS || '').split(',').filter(Boolean).map(Number),
  },
  telegraph: {
    accessToken: process.env.TELEGRAPH_ACCESS_TOKEN || 'e381330fb7dd5130dea695b5930071d4aede79248752ad2e05e2f2b34355',
    apiUrl: 'https://api.telegra.ph',
    authorName: process.env.TELEGRAPH_AUTHOR_NAME || '',
    authorUrl: process.env.TELEGRAPH_AUTHOR_URL || '',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/telegraphbot',
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
  },
};
