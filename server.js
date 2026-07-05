// ============================================================
// Eko Elites Club Inc. — application server (entry point)
//
//   server.js            this file: HTTP server + static files
//   server/config.js     .env loading and settings
//   server/db.js         Neon Postgres queries (server-side only)
//   server/auth.js       password hashing + session tokens
//   server/api.js        the fixed /api/* endpoints
//   public/              everything the browser is allowed to see
//
// Run locally:   node server.js     → http://localhost:3000
// Deploy:        any Node.js host (Render, Railway, Fly.io, cPanel with
//                Node support, etc.). Requires Node 18+. No npm install.
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const { PORT, PUBLIC_DIR, DATABASE_URL, ADMIN_PASSCODE } = require('./server/config');
const api = require('./server/api');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    if (await api.handle(req, res)) return;
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: e.message }));
    return;
  }

  // Static files — only ever served out of public/, never dotfiles.
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  const rel = path.relative(PUBLIC_DIR, filePath);
  if (rel.startsWith('..') || rel.split(path.sep).some((seg) => seg.startsWith('.'))) {
    res.writeHead(404); res.end('Not found'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('Eko Elites Club site running at http://localhost:' + PORT);
  console.log(DATABASE_URL ? 'Database: configured ✓' : 'Database: DATABASE_URL missing in .env ✗');
  console.log(ADMIN_PASSCODE ? 'Admin passcode: configured ✓' : 'Admin passcode: ADMIN_PASSCODE missing in .env ✗ (admin page disabled)');
});
