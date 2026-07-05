// ============================================================
// Eko Elites Club Inc. — application server
// Serves the static website AND connects it to the Neon database.
// The connection string stays server-side in .env (never sent to browsers).
//
// Run locally:   node server.js     → http://localhost:3000
// Deploy:        any Node.js host (Render, Railway, Fly.io, cPanel with
//                Node support, etc.). Requires Node 18+. No npm install needed.
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

// ── Read DATABASE_URL from .env ─────────────────────────────
function loadEnv() {
  const env = {};
  try {
    const text = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !line.trim().startsWith('#')) env[m[1]] = m[2];
    }
  } catch (e) { /* no .env file */ }
  return env;
}
const ENV = loadEnv();
const DATABASE_URL = process.env.DATABASE_URL || ENV.DATABASE_URL || '';
const PORT = process.env.PORT || 3000;

// ── Forward SQL queries to Neon over HTTPS (server-to-server) ──
async function runSql(body) {
  if (!DATABASE_URL) {
    return { status: 500, json: { message: 'DATABASE_URL is not set in .env' } };
  }
  const host = DATABASE_URL.match(/@([^/]+)\//)[1];
  const r = await fetch('https://' + host + '/sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': DATABASE_URL
    },
    body: JSON.stringify({ query: body.query, params: body.params || [] })
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = { message: text }; }
  return { status: r.status, json };
}

// ── Static file serving ─────────────────────────────────────
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
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8'
};
// Never serve these over the web:
const BLOCKED = ['.env', 'server.js', 'db', 'DATABASE.md', 'uploads'];

const server = http.createServer(async (req, res) => {
  // API endpoint the website calls for all database queries
  if (req.method === 'POST' && req.url === '/api/sql') {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(raw || '{}');
        if (typeof body.query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Missing query' }));
          return;
        }
        const out = await runSql(body);
        res.writeHead(out.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out.json));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: e.message }));
      }
    });
    return;
  }

  // Static files
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(__dirname, urlPath));
  const rel = path.relative(__dirname, filePath);
  if (rel.startsWith('..') || BLOCKED.some((b) => rel === b || rel.startsWith(b + path.sep))) {
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
});
