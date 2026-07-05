// Environment / configuration for the Eko Elites Club server.
// Values come from real environment variables first, then from the
// private .env file in the project root. Nothing here is ever sent
// to the browser.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadEnvFile() {
  const env = {};
  try {
    const text = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !line.trim().startsWith('#')) env[m[1]] = m[2];
    }
  } catch (e) { /* no .env file */ }
  return env;
}

const FILE_ENV = loadEnvFile();
const get = (name, fallback) => process.env[name] || FILE_ENV[name] || fallback || '';

const DATABASE_URL = get('DATABASE_URL');

// Secret used to sign session tokens. Set SESSION_SECRET in .env to keep
// sessions valid across restarts; otherwise one is derived so that a
// missing value never means an unsigned token.
const SESSION_SECRET =
  get('SESSION_SECRET') ||
  (DATABASE_URL
    ? crypto.createHash('sha256').update('eec-session|' + DATABASE_URL).digest('hex')
    : crypto.randomBytes(32).toString('hex'));

module.exports = {
  PORT: parseInt(get('PORT', '3000'), 10),
  DATABASE_URL,
  ADMIN_PASSCODE: get('ADMIN_PASSCODE'),
  SESSION_SECRET,
  PUBLIC_DIR: path.join(__dirname, '..', 'public')
};
