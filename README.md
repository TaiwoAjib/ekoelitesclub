# Eko Elites Club Inc. — Website

Membership website for Eko Elites Club Inc. (Indianapolis, Indiana, USA). A zero-dependency Node.js server serves the static frontend and exposes a small, fixed API backed by a Neon Postgres database. The browser never talks to the database directly and never sends SQL.

## Project structure

```
server.js                 Entry point: HTTP server + static file serving
server/                   Server-side code (never served to browsers)
  config.js               Reads .env / environment variables
  db.js                   Neon Postgres queries over HTTPS
  auth.js                 scrypt password hashing + HMAC session tokens
  api.js                  The fixed /api/* endpoints and router
  site-defaults.js        Built-in site content (first-run seed + fallback)
public/                   Everything the browser is allowed to see
  index.html              Home page (stats, upcoming activities)
  about.html              Club history and mission
  executives.html         Executive officers and duties
  gallery.html            Event photo gallery
  register.html           Member sign-up
  login.html              Member login
  profile.html            Member dashboard
  admin.html              Content administration (passcode-gated)
  js/
    api.js                Client for the /api/* endpoints
    site-data.js          Shared site-content loader
    support.js            Generated UI runtime (do not edit)
  images/                 Logo, executive portraits, event photos
uploads/                  Not served; scratch storage
.env                      Secrets — NEVER commit (already in .gitignore)
```

## API

All write routes require a `Authorization: Bearer <token>` header. Tokens are HMAC-signed by the server (`SESSION_SECRET`) and expire on their own — 30 days for members, 12 hours for admin.

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/site-data` | — | Site content (stats, executives, gallery, activities) |
| `PUT /api/site-data` | admin | Save site content |
| `POST /api/auth/register` | — | Create a member account → `{ token, member }` |
| `POST /api/auth/login` | — | Member login → `{ token, member }` |
| `GET /api/me` | member | Own profile |
| `PUT /api/me` | member | Update phone / city |
| `POST /api/admin/login` | — | Passcode → admin token |
| `GET /api/admin/members` | admin | List registered members |
| `DELETE /api/admin/members?email=` | admin | Remove a member |

Passwords are hashed server-side with scrypt and a per-user salt. Accounts created by the first version of the site (unsalted SHA-256) still work and are upgraded to scrypt automatically on their next login.

## Running locally

Requires Node.js 18+. No `npm install` needed.

1. Create `.env` in the project root:

   ```
   DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
   ADMIN_PASSCODE="choose-a-strong-passcode"
   SESSION_SECRET="any-long-random-string"
   ```

2. Start the server:

   ```
   npm start
   ```

3. Open http://localhost:3000 — the admin page is at `/admin.html`.

The startup log tells you whether the database and admin passcode are configured.

## Deploying

Any Node.js host works (Render, Railway, Fly.io, cPanel with Node support, etc.). Set `DATABASE_URL`, `ADMIN_PASSCODE`, and `SESSION_SECRET` in the host's environment settings instead of uploading `.env`. Only `server.js`, `server/`, `public/`, and `package.json` are needed in the deployment.

## Security notes

- `.env` is gitignored — keep it that way; it holds the database credential and admin passcode.
- The old admin passcode (`Akpodiete@321`) appeared in the public site files before this restructure. Change `ADMIN_PASSCODE` to a new value.
- There is no rate limiting on login attempts yet; consider adding it (or hosting behind a proxy that provides it) before the member base grows.
