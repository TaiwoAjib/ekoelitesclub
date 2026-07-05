# Eko Elites Club Inc. — Website

Membership website for Eko Elites Club Inc. (Indianapolis, Indiana, USA): a static frontend served by a small Node.js server that also connects the site to its Neon Postgres database.

## Pages

- `index.html` — home page with club stats and upcoming activities
- `about.html` — club history and mission
- `executives.html` — executive officers and their duties
- `gallery.html` — event photo gallery
- `register.html` / `login.html` / `profile.html` — member accounts
- `admin.html` — content administration
- `support.js` / `site-data.js` / `neon-db.js` — shared client-side modules

## Running locally

Requires Node.js 18+. No `npm install` needed.

1. Create a `.env` file in the project root:

   ```
   DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
   ```

2. Start the server:

   ```
   npm start
   ```

3. Open http://localhost:3000

The connection string stays server-side: pages call the built-in `/api/sql` endpoint in `server.js`, which forwards queries to Neon over HTTPS. **Never commit `.env`** — it is listed in `.gitignore`.

## Deploying

Any Node.js host works (Render, Railway, Fly.io, cPanel with Node support, etc.). Set the `DATABASE_URL` environment variable in the host's dashboard instead of uploading `.env`.
