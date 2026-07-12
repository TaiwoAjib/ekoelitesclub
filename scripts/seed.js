// Populate the database with starter records. Safe to run repeatedly:
// existing rows are never overwritten (ON CONFLICT DO NOTHING), so real
// content and real member accounts are untouched.
//
//   node scripts/seed.js          (or: npm run seed)
//
// Seeds:
//   site_data  — the editable site content, from server/site-defaults.js
//   members    — sample member accounts (@example.com addresses, all with
//                the password "Welcome@123") so the member list, profile,
//                and admin pages have something to show. Remove them from
//                the admin page whenever you like.

const { query, ensureSchema } = require('../server/db');
const { hashPassword } = require('../server/auth');
const DEFAULTS = require('../server/site-defaults');

const SAMPLE_PASSWORD = 'Welcome@123';

const SAMPLE_MEMBERS = [
  { email: 'adewale.johnson@example.com',  name: 'Adewale Johnson',  phone: '317-555-0101', city: 'Indianapolis', connection: 'Born in Lagos',          joined: '2024-02-04' },
  { email: 'funmilayo.adeyemi@example.com', name: 'Funmilayo Adeyemi', phone: '317-555-0112', city: 'Carmel',       connection: 'Family from Lagos',      joined: '2024-03-03' },
  { email: 'olusegun.bakare@example.com',  name: 'Olusegun Bakare',  phone: '317-555-0123', city: 'Fishers',      connection: 'Born in Lagos',          joined: '2024-05-05' },
  { email: 'chidinma.okafor@example.com',  name: 'Chidinma Okafor',  phone: '317-555-0134', city: 'Indianapolis', connection: 'Friend of the club',     joined: '2024-08-04' },
  { email: 'babatunde.ogunleye@example.com', name: 'Babatunde Ogunleye', phone: '317-555-0145', city: 'Greenwood',  connection: 'Born in Lagos',          joined: '2025-01-05' },
  { email: 'yetunde.balogun@example.com',  name: 'Yetunde Balogun',  phone: '317-555-0156', city: 'Indianapolis', connection: 'Family from Lagos',      joined: '2025-04-06' },
  { email: 'emeka.nwosu@example.com',      name: 'Emeka Nwosu',      phone: '317-555-0167', city: 'Avon',         connection: 'Friend of the club',     joined: '2025-09-07' },
  { email: 'aisha.lawal@example.com',      name: 'Aisha Lawal',      phone: '317-555-0178', city: 'Zionsville',   connection: 'Born in Lagos',          joined: '2026-01-04' }
];

async function main() {
  console.log('Connecting and ensuring tables exist…');
  await ensureSchema();

  const site = await query(
    'INSERT INTO site_data (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',
    [JSON.stringify(DEFAULTS)]
  );
  console.log('site_data: ' + (site.rowCount ? 'seeded with defaults' : 'already has content — left as is'));

  let added = 0;
  for (const m of SAMPLE_MEMBERS) {
    const r = await query(
      'INSERT INTO members (email, name, phone, city, connection, pass_hash, joined) ' +
      'VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (email) DO NOTHING',
      [m.email, m.name, m.phone, m.city, m.connection, hashPassword(SAMPLE_PASSWORD), m.joined]
    );
    if (r.rowCount) added++;
  }
  console.log('members: ' + added + ' sample member(s) added, ' + (SAMPLE_MEMBERS.length - added) + ' already present');

  const total = await query('SELECT count(*)::int AS n FROM members');
  console.log('members table now has ' + total.rows[0].n + ' record(s)');
  console.log('Sample accounts log in with the password: ' + SAMPLE_PASSWORD);
}

main().catch((e) => { console.error('Seed failed: ' + e.message); process.exit(1); });
