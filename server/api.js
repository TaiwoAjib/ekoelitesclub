// HTTP API for the Eko Elites Club website. Every route runs a fixed,
// parameterised query — the browser can never send SQL. Write routes
// require a signed session token (member or admin).
//
//   GET    /api/site-data              public site content
//   PUT    /api/site-data              save site content        (admin)
//   POST   /api/auth/register          create a member account
//   POST   /api/auth/login             member login → token
//   GET    /api/me                     own profile              (member)
//   PUT    /api/me                     update phone/city        (member)
//   POST   /api/admin/login            passcode → admin token
//   GET    /api/admin/members          list members             (admin)
//   DELETE /api/admin/members?email=   remove a member          (admin)
//   POST   /api/admin/upload?path=     save an image file       (admin)

const fs = require('fs');
const path = require('path');
const { query, ensureSchema } = require('./db');
const auth = require('./auth');
const imageStore = require('./images');
const DEFAULTS = require('./site-defaults');
const { ADMIN_PASSCODE, PUBLIC_DIR } = require('./config');

const IMAGE_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const MEMBER_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const ADMIN_TTL = 12 * 60 * 60 * 1000;       // 12 hours
const MAX_BODY = 2 * 1024 * 1024;            // 2 MB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MEMBER_COLS = 'email, name, phone, city, connection, joined';

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > MAX_BODY) { reject(new Error('Request body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

// Old site_data rows stored the admin passcode inside the content blob;
// never let it back out (or back in).
function stripSecrets(data) {
  if (data && typeof data === 'object') delete data.adminPasscode;
  return data;
}

function requireRole(req, res, role) {
  const payload = auth.readToken(auth.bearerToken(req), role);
  if (!payload) { json(res, 401, { message: 'Not authorized' }); return null; }
  return payload;
}

// ── Site content ────────────────────────────────────────────

async function getSiteData(req, res) {
  try {
    await ensureSchema();
    const r = await query('SELECT data FROM site_data WHERE id = 1');
    if (r.rows && r.rows.length) {
      let v = r.rows[0].data;
      if (typeof v === 'string') v = JSON.parse(v);
      return json(res, 200, { data: stripSecrets(v) });
    }
    await query(
      'INSERT INTO site_data (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',
      [JSON.stringify(DEFAULTS)]
    );
    return json(res, 200, { data: DEFAULTS });
  } catch (e) {
    // Keep the site rendering even when the database is down.
    return json(res, 200, { data: DEFAULTS, warning: 'database unreachable: ' + e.message });
  }
}

async function putSiteData(req, res) {
  if (!requireRole(req, res, 'admin')) return;
  const body = await readBody(req);
  const data = stripSecrets(body.data);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json(res, 400, { message: 'Missing data object' });
  }
  await ensureSchema();
  await query(
    'INSERT INTO site_data (id, data) VALUES (1, $1::jsonb) ' +
    'ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = now()',
    [JSON.stringify(data)]
  );
  json(res, 200, { ok: true });
}

// ── Member accounts ─────────────────────────────────────────

async function register(req, res) {
  const b = await readBody(req);
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  if (!name || !email) return json(res, 400, { message: 'Name and email are required.' });
  if (!EMAIL_RE.test(email)) return json(res, 400, { message: 'That email address does not look valid.' });
  if (password.length < 6) return json(res, 400, { message: 'Password must be at least 6 characters.' });

  await ensureSchema();
  const existing = await query('SELECT email FROM members WHERE email = $1', [email]);
  if (existing.rows && existing.rows.length) {
    return json(res, 409, { message: 'An account with this email already exists.' });
  }
  await query(
    'INSERT INTO members (email, name, phone, city, connection, pass_hash) VALUES ($1,$2,$3,$4,$5,$6)',
    [email, name, String(b.phone || '').trim(), String(b.city || '').trim(),
     String(b.connection || ''), auth.hashPassword(password)]
  );
  const r = await query('SELECT ' + MEMBER_COLS + ' FROM members WHERE email = $1', [email]);
  json(res, 201, { token: auth.makeToken(email, 'member', MEMBER_TTL), member: r.rows[0] });
}

async function login(req, res) {
  const b = await readBody(req);
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  await ensureSchema();
  const r = await query('SELECT ' + MEMBER_COLS + ', pass_hash FROM members WHERE email = $1', [email]);
  const m = r.rows && r.rows[0];
  const check = m ? auth.verifyPassword(password, m.pass_hash) : { ok: false };
  if (!m || !check.ok) return json(res, 401, { message: 'Email or password not recognized.' });
  if (check.needsRehash) {
    await query('UPDATE members SET pass_hash = $1 WHERE email = $2', [auth.hashPassword(password), email]);
  }
  delete m.pass_hash;
  json(res, 200, { token: auth.makeToken(email, 'member', MEMBER_TTL), member: m });
}

async function getMe(req, res) {
  const payload = requireRole(req, res, 'member');
  if (!payload) return;
  const r = await query('SELECT ' + MEMBER_COLS + ' FROM members WHERE email = $1', [payload.sub]);
  const m = r.rows && r.rows[0];
  if (!m) return json(res, 404, { message: 'Account no longer exists.' });
  json(res, 200, { member: m });
}

async function updateMe(req, res) {
  const payload = requireRole(req, res, 'member');
  if (!payload) return;
  const b = await readBody(req);
  await query('UPDATE members SET phone = $1, city = $2 WHERE email = $3',
    [String(b.phone || '').trim(), String(b.city || '').trim(), payload.sub]);
  const r = await query('SELECT ' + MEMBER_COLS + ' FROM members WHERE email = $1', [payload.sub]);
  json(res, 200, { member: r.rows[0] });
}

// ── Admin ───────────────────────────────────────────────────

async function adminLogin(req, res) {
  const b = await readBody(req);
  if (!ADMIN_PASSCODE) {
    return json(res, 500, { message: 'ADMIN_PASSCODE is not set in .env on the server.' });
  }
  if (!auth.safeEqual(String(b.passcode || ''), ADMIN_PASSCODE)) {
    return json(res, 401, { message: 'Wrong passcode.' });
  }
  json(res, 200, { token: auth.makeToken('admin', 'admin', ADMIN_TTL) });
}

async function adminMembers(req, res) {
  if (!requireRole(req, res, 'admin')) return;
  await ensureSchema();
  const r = await query('SELECT ' + MEMBER_COLS + ' FROM members ORDER BY joined DESC, name');
  json(res, 200, { members: r.rows || [] });
}

async function adminDeleteMember(req, res, searchParams) {
  if (!requireRole(req, res, 'admin')) return;
  const email = String(searchParams.get('email') || '').trim().toLowerCase();
  if (!email) return json(res, 400, { message: 'Missing email' });
  await query('DELETE FROM members WHERE email = $1', [email]);
  json(res, 200, { ok: true });
}

// Saves an uploaded image (raw request body) into the database so the
// executives, gallery, and home pages can display it, and caches a copy
// on disk. Only image extensions, only inside images/ — no traversal.
const MAX_UPLOAD = 8 * 1024 * 1024; // 8 MB
const UPLOAD_PATH_RE = /^images\/[A-Za-z0-9][A-Za-z0-9 _./-]*\.(jpg|jpeg|png|webp)$/i;

function readRawBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('Upload too large (max 8 MB)')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function adminUpload(req, res, searchParams) {
  if (!requireRole(req, res, 'admin')) return;
  const rel = String(searchParams.get('path') || '');
  if (!UPLOAD_PATH_RE.test(rel) || rel.includes('..')) {
    return json(res, 400, { message: 'Invalid image path' });
  }
  const dest = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!dest.startsWith(path.join(PUBLIC_DIR, 'images') + path.sep)) {
    return json(res, 400, { message: 'Invalid image path' });
  }
  const body = await readRawBody(req, MAX_UPLOAD);
  if (!body.length) return json(res, 400, { message: 'Empty upload' });
  const contentType = IMAGE_TYPES[path.extname(rel).toLowerCase()] || 'application/octet-stream';

  // The database is the durable store (survives redeploys); disk is a
  // best-effort cache and must not fail the upload if it is read-only.
  await imageStore.saveImage(rel, contentType, body);
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, body);
  } catch (e) { /* disk cache is optional */ }

  json(res, 200, { ok: true, path: rel, bytes: body.length });
}

// ── Router ──────────────────────────────────────────────────

const ROUTES = {
  'GET /api/site-data': getSiteData,
  'PUT /api/site-data': putSiteData,
  'POST /api/auth/register': register,
  'POST /api/auth/login': login,
  'GET /api/me': getMe,
  'PUT /api/me': updateMe,
  'POST /api/admin/login': adminLogin,
  'GET /api/admin/members': adminMembers,
  'DELETE /api/admin/members': adminDeleteMember,
  'POST /api/admin/upload': adminUpload
};

// Handles /api/* requests. Returns true if the URL was an API route.
async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return false;
  const handler = ROUTES[req.method + ' ' + url.pathname];
  if (!handler) { json(res, 404, { message: 'No such API endpoint' }); return true; }
  try {
    await handler(req, res, url.searchParams);
  } catch (e) {
    json(res, 500, { message: e.message || 'Server error' });
  }
  return true;
}

module.exports = { handle };
