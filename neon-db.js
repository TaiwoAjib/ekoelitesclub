// Neon Postgres access for the Eko Elites Club website.
//
// The connection string lives in the private .env file (DATABASE_URL),
// read only by server.js — it is never sent to the browser. The pages
// render entirely client-side; only database queries go through the
// built-in /api/sql endpoint that server.js provides. See DATABASE.md.

export const PROXY_URL = '/api/sql';

export async function sql(query, params = []) {
  if (!PROXY_URL) {
    throw new Error('Database not configured yet — see DATABASE.md');
  }
  const r = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, params })
  });
  if (!r.ok) {
    let msg = '';
    try { msg = (await r.json()).message || ''; } catch (e) { /* ignore */ }
    throw new Error('Database error (' + r.status + ')' + (msg ? ': ' + msg : ''));
  }
  return r.json(); // { rows, rowCount, command, fields }
}

let ensured = false;
export async function ensureTables() {
  if (ensured) return;
  await sql(
    'CREATE TABLE IF NOT EXISTS site_data (' +
    'id integer PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz DEFAULT now())'
  );
  await sql(
    'CREATE TABLE IF NOT EXISTS members (' +
    'email text PRIMARY KEY, name text NOT NULL, phone text DEFAULT \'\', ' +
    'city text DEFAULT \'\', connection text DEFAULT \'\', ' +
    'pass_hash text NOT NULL, joined date DEFAULT CURRENT_DATE)'
  );
  ensured = true;
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
