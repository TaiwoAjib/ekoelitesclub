// Client for the website's own API (see server/api.js). The browser never
// talks to the database directly and never sends SQL — only these fixed
// endpoints. Session tokens are issued by the server and passed back as
// Bearer tokens on protected calls.

async function request(method, url, body, token) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const r = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await r.json(); } catch (e) { /* non-JSON error body */ }
  if (!r.ok) {
    const err = new Error((json && json.message) || 'Request failed (' + r.status + ')');
    err.status = r.status;
    throw err;
  }
  return json || {};
}

// Site content
export const getSiteData = () => request('GET', '/api/site-data');
export const putSiteData = (data, token) => request('PUT', '/api/site-data', { data }, token);

// Member accounts — register/login resolve to { token, member }
export const register = (fields) => request('POST', '/api/auth/register', fields);
export const login = (email, password) => request('POST', '/api/auth/login', { email, password });
export const getProfile = (token) => request('GET', '/api/me', undefined, token);
export const updateProfile = (token, fields) => request('PUT', '/api/me', fields, token);

// Admin
export const adminLogin = (passcode) => request('POST', '/api/admin/login', { passcode });
export const adminMembers = (token) => request('GET', '/api/admin/members', undefined, token);
export const adminDeleteMember = (token, email) =>
  request('DELETE', '/api/admin/members?email=' + encodeURIComponent(email), undefined, token);

// Saves an image file (Blob) into the website's images/ folder so it
// shows up wherever that path is linked. Admin only.
export async function uploadImage(token, imagePath, blob) {
  const r = await fetch('/api/admin/upload?path=' + encodeURIComponent(imagePath), {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/octet-stream' },
    body: blob
  });
  let json = null;
  try { json = await r.json(); } catch (e) { /* non-JSON error body */ }
  if (!r.ok) {
    const err = new Error((json && json.message) || 'Upload failed (' + r.status + ')');
    err.status = r.status;
    throw err;
  }
  return json;
}
