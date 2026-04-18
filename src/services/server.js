const express = require('express');
const config = require('../../config');

function startServer() {
  const app = express();
  const PORT = config.server.port;

  app.use(express.json());

  // Health check endpoint (required by Render)
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      service: 'telegraph-bot',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
  });

  return app;
}

module.exports = { startServer };
