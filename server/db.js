// Neon Postgres access (server-side only). Queries go to Neon's HTTPS
// SQL endpoint using the connection string from .env — the browser never
// sees the credential and never sends raw SQL; only the fixed handlers
// in api.js call query().

const { DATABASE_URL } = require('./config');

async function query(text, params = []) {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not set in .env');
  const host = DATABASE_URL.match(/@([^/]+)\//)[1];
  const r = await fetch('https://' + host + '/sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': DATABASE_URL
    },
    body: JSON.stringify({ query: text, params })
  });
  const raw = await r.text();
  let json;
  try { json = JSON.parse(raw); } catch (e) { json = { message: raw }; }
  if (!r.ok) throw new Error(json.message || 'Database error (' + r.status + ')');
  return json; // { rows, rowCount, command, fields }
}

let ensured = false;
async function ensureSchema() {
  if (ensured) return;
  await query(
    'CREATE TABLE IF NOT EXISTS site_data (' +
    'id integer PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz DEFAULT now())'
  );
  await query(
    'CREATE TABLE IF NOT EXISTS members (' +
    'email text PRIMARY KEY, name text NOT NULL, phone text DEFAULT \'\', ' +
    'city text DEFAULT \'\', connection text DEFAULT \'\', ' +
    'pass_hash text NOT NULL, joined date DEFAULT CURRENT_DATE)'
  );
  ensured = true;
}

module.exports = { query, ensureSchema };
