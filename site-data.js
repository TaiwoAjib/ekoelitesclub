// Shared data layer for the Eko Elites Club site.
// Site content lives in the Neon Postgres database (site_data table, one
// JSONB row). If the database is unreachable the built-in defaults below
// keep the site rendering.

import { sql, ensureTables, PROXY_URL } from './neon-db.js';

const DEFAULTS = {
  adminPasscode: 'Akpodiete@321',
  site: {
    email: 'info@ekoelitesclub.org',
    location: 'Indianapolis, Indiana, USA',
    meeting: 'General meeting: first Sunday of every month',
    historyPhoto: 'images/history.jpg'
  },
  stats: [
    { value: '120+', label: 'ACTIVE MEMBERS' },
    { value: '2018', label: 'ESTABLISHED' },
    { value: '30+', label: 'EVENTS HOSTED' },
    { value: '9', label: 'EXECUTIVE OFFICES' }
  ],
  executives: [
    { office: 'PRESIDENT', slotId: 'exec-president', name: 'Officer Name', photo: 'images/executives/president.jpg', duty: 'Leads the club, presides over meetings, and represents Eko Elites Club Inc. in Indiana and beyond.' },
    { office: 'VICE PRESIDENT', slotId: 'exec-vice-president', name: 'Officer Name', photo: 'images/executives/vice-president.jpg', duty: 'Supports the president and acts in their stead, coordinating committees and special projects.' },
    { office: 'GENERAL SECRETARY', slotId: 'exec-secretary', name: 'Officer Name', photo: 'images/executives/secretary.jpg', duty: 'Keeps records and minutes, handles correspondence, and communicates decisions to members.' },
    { office: 'TREASURER', slotId: 'exec-treasurer', name: 'Officer Name', photo: 'images/executives/treasurer.jpg', duty: 'Safeguards club funds, manages the accounts, and reports on the club\u2019s financial position.' },
    { office: 'FINANCIAL SECRETARY', slotId: 'exec-financial-secretary', name: 'Officer Name', photo: 'images/executives/financial-secretary.jpg', duty: 'Collects dues and levies, issues receipts, and keeps accurate financial records.' },
    { office: 'PUBLIC RELATIONS OFFICER', slotId: 'exec-pro', name: 'Officer Name', photo: 'images/executives/pro.jpg', duty: 'Manages publicity and the club\u2019s public image, and liaises with the press and partner bodies.' },
    { office: 'SOCIAL SECRETARY', slotId: 'exec-social-secretary', name: 'Officer Name', photo: 'images/executives/social-secretary.jpg', duty: 'Plans the owambes \u2014 galas, festivals, picnics \u2014 and everything that brings members together.' },
    { office: 'WELFARE OFFICER', slotId: 'exec-welfare-officer', name: 'Officer Name', photo: 'images/executives/welfare-officer.jpg', duty: 'Looks after members\u2019 wellbeing, coordinating support through milestones and hardships.' },
    { office: 'PROVOST', slotId: 'exec-provost', name: 'Officer Name', photo: 'images/executives/provost.jpg', duty: 'Keeps order at meetings and events, and upholds the club\u2019s code of conduct.' }
  ],
  gallery: [
    { slotId: 'gal-eyo-festival', title: 'Eyo Cultural Day', date: 'May 2026', tag: 'FESTIVAL', cat: 'Festivals', photo: 'images/events/eyo-festival.jpg' },
    { slotId: 'gal-annual-gala', title: 'Annual Gala Night', date: 'December 2025', tag: 'GALA', cat: 'Galas', photo: 'images/events/annual-gala.jpg' },
    { slotId: 'gal-independence', title: 'Independence Day Picnic', date: 'October 2025', tag: 'FESTIVAL', cat: 'Festivals', photo: 'images/events/independence.jpg' },
    { slotId: 'gal-outreach', title: 'Community Outreach', date: 'September 2025', tag: 'COMMUNITY', cat: 'Community', photo: 'images/events/outreach.jpg' },
    { slotId: 'gal-health-walk', title: 'Health Walk for Charity', date: 'August 2025', tag: 'COMMUNITY', cat: 'Community', photo: 'images/events/health-walk.jpg' },
    { slotId: 'gal-general-meeting', title: 'General Meeting', date: 'July 2025', tag: 'MEETING', cat: 'Meetings', photo: 'images/events/general-meeting.jpg' },
    { slotId: 'gal-christmas', title: 'Christmas Party', date: 'December 2024', tag: 'GALA', cat: 'Galas', photo: 'images/events/christmas.jpg' },
    { slotId: 'gal-cultural-day', title: 'Lagos Cultural Day', date: 'June 2025', tag: 'FESTIVAL', cat: 'Festivals', photo: 'images/events/cultural-day.jpg' },
    { slotId: 'gal-inauguration', title: 'Executive Inauguration', date: 'January 2026', tag: 'MEETING', cat: 'Meetings', photo: 'images/events/inauguration.jpg' }
  ],
  activities: [
    { day: '02', month: 'AUG', title: 'General Meeting', detail: 'First Sunday of the month \u00b7 Indianapolis' },
    { day: '15', month: 'AUG', title: 'Eyo Cultural Day', detail: 'Family-friendly festival with music, food, and dance' },
    { day: '03', month: 'OCT', title: 'Independence Gala', detail: 'Nigeria @ 66 black-tie gala \u00b7 tickets at the meeting' }
  ]
};

export async function loadSiteData() {
  try {
    await ensureTables();
    const r = await sql('SELECT data FROM site_data WHERE id = 1');
    if (r.rows && r.rows.length) {
      const v = r.rows[0].data;
      return typeof v === 'string' ? JSON.parse(v) : v;
    }
    // First run: seed the database with the defaults.
    await sql('INSERT INTO site_data (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING', [JSON.stringify(DEFAULTS)]);
    return DEFAULTS;
  } catch (e) {
    console.warn('Database unreachable, using built-in defaults:', e.message);
    return DEFAULTS;
  }
}

export function canSave() {
  return !!PROXY_URL;
}

export async function saveSiteData(data) {
  await ensureTables();
  await sql(
    'INSERT INTO site_data (id, data) VALUES (1, $1::jsonb) ' +
    'ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = now()',
    [JSON.stringify(data)]
  );
}

// Check which image files actually exist on the host, so pages can show a
// styled placeholder instead of a broken image. Returns { [path]: true|false }.
export async function probePhotos(paths) {
  const uniq = [...new Set((paths || []).filter(Boolean))];
  const entries = await Promise.all(uniq.map(async (p) => {
    try {
      const r = await fetch(p, { method: 'HEAD', cache: 'no-store' });
      return [p, r.ok];
    } catch (e) { return [p, false]; }
  }));
  const map = {};
  for (const [p, ok] of entries) map[p] = ok;
  return map;
}
