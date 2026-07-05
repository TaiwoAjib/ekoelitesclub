// Password hashing and session tokens (server-side only).
//
// Passwords: scrypt with a random per-user salt, stored as
// "scrypt:<salt>:<hash>". Accounts created by the first version of the
// site stored an unsalted SHA-256 of the password; those still verify
// and are transparently upgraded to scrypt on the next successful login.
//
// Sessions: compact HMAC-signed tokens — base64url(payload).signature —
// carrying { sub, role, exp }. No server-side session store needed.

const crypto = require('crypto');
const { SESSION_SECRET } = require('./config');

const SCRYPT_KEYLEN = 32;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN).toString('hex');
  return 'scrypt:' + salt + ':' + hash;
}

// Returns { ok, needsRehash } — needsRehash means the stored value uses
// the legacy SHA-256 format and should be replaced via hashPassword().
function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored) return { ok: false, needsRehash: false };
  if (stored.startsWith('scrypt:')) {
    const [, salt, hex] = stored.split(':');
    const calc = crypto.scryptSync(String(password), salt || '', SCRYPT_KEYLEN).toString('hex');
    return { ok: safeEqual(calc, hex), needsRehash: false };
  }
  const legacy = crypto.createHash('sha256').update(String(password)).digest('hex');
  return { ok: safeEqual(legacy, stored), needsRehash: true };
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function sign(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

function makeToken(sub, role, ttlMs) {
  const payload = Buffer.from(JSON.stringify({ sub, role, exp: Date.now() + ttlMs }))
    .toString('base64url');
  return payload + '.' + sign(payload);
}

// Returns the token payload if the signature, role, and expiry all check
// out; null otherwise.
function readToken(token, role) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!safeEqual(sign(payload), sig)) return null;
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!data || data.role !== role || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
  return data;
}

function bearerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

module.exports = { hashPassword, verifyPassword, safeEqual, makeToken, readToken, bearerToken };
