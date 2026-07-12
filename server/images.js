// Durable image storage. Uploaded photos are kept in the database (as
// base64 in the images table) so they survive redeploys and are shared
// across server instances — the local public/images/ folder is only ever
// a cache that can be wiped and rebuilt from the database on demand.
//
// Committed repo assets (e.g. images/logo.jpg) are served straight from
// disk and never touch this table.

const { query } = require('./db');

let ensured = false;
async function ensureImagesTable() {
  if (ensured) return;
  await query(
    'CREATE TABLE IF NOT EXISTS images (' +
    'path text PRIMARY KEY, content_type text NOT NULL, ' +
    'data text NOT NULL, updated_at timestamptz DEFAULT now())'
  );
  ensured = true;
}

// path is the forward-slash web path, e.g. "images/executives/president.jpg"
async function saveImage(path, contentType, buffer) {
  await ensureImagesTable();
  await query(
    'INSERT INTO images (path, content_type, data, updated_at) ' +
    'VALUES ($1, $2, $3, now()) ' +
    'ON CONFLICT (path) DO UPDATE SET content_type = $2, data = $3, updated_at = now()',
    [path, contentType, buffer.toString('base64')]
  );
}

// Returns { contentType, buffer } or null if the image is not stored.
async function getImage(path) {
  await ensureImagesTable();
  const r = await query('SELECT content_type, data FROM images WHERE path = $1', [path]);
  if (!r.rows || !r.rows.length) return null;
  return { contentType: r.rows[0].content_type, buffer: Buffer.from(r.rows[0].data, 'base64') };
}

module.exports = { saveImage, getImage };
