// Shared data layer for the Eko Elites Club site. Site content lives in
// the database (site_data table); the server returns built-in defaults
// when that table is empty or unreachable, so loadSiteData() always
// resolves with renderable content as long as the server is up.

import { getSiteData, putSiteData } from './api.js';

export async function loadSiteData() {
  const r = await getSiteData();
  return r.data;
}

export function canSave() {
  return true;
}

// Saving site content requires an admin session token (from admin.html).
export async function saveSiteData(data, adminToken) {
  await putSiteData(data, adminToken);
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
