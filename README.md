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
  calendar.html           Year-long programme of activities
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
| `GET /api/site-data` | — | Site content (stats, executives, gallery, activities, calendar) |
| `PUT /api/site-data` | admin | Save site content |
| `POST /api/auth/register` | — | Create a member account → `{ token, member }` |
| `POST /api/auth/login` | — | Member login → `{ token, member }` |
| `GET /api/me` | member | Own profile |
| `PUT /api/me` | member | Update phone / city |
| `POST /api/admin/login` | — | Passcode → admin token |
| `GET /api/admin/members` | admin | List registered members |
| `DELETE /api/admin/members?email=` | admin | Remove a member |
| `POST /api/admin/upload?path=` | admin | Store an image (executive portraits, event photos) — see below |

Passwords are hashed server-side with scrypt and a per-user salt. Accounts created by the first version of the site (unsalted SHA-256) still work and are upgraded to scrypt automatically on their next login.

### Image uploads

When an admin picks a photo, it is resized in the browser and sent to
`POST /api/admin/upload`. The server stores it in the database (`images`
table) and caches a copy under `public/images/`. Requests for an image
are served from the disk cache when present, otherwise from the database
(which also rebuilds the disk cache). Storing the durable copy in the
database is deliberate: many hosts replace `public/` with the repo copy
on every deploy, so disk-only uploads would vanish. The `public/images/`
upload folders are gitignored for the same reason — the database is the
source of truth.

## Using the website

### Member accounts (login & profile)

Members create their own accounts — no admin action is needed.

1. **Register.** From any page, click **Join the Club** (or open `/register.html`). Fill in name, email, phone, city, and Lagos connection, and choose a password (minimum 6 characters). On success the member is signed in and taken to their dashboard.
2. **Log in.** Click **Member Login** (or open `/login.html`) and enter the registered email and password.
3. **Profile dashboard** (`/profile.html`). Signed-in members can see their details and the upcoming activities, and can update their **phone** and **city**. Name and email are fixed.
4. **Log out.** Use the **Log Out** button in the header on the profile page.

Notes:
- Sessions last **30 days**, stored as a signed token in the browser (`localStorage`), so members stay logged in across visits until it expires or they log out.
- Passwords are hashed on the server (scrypt + per-user salt); they are never stored or transmitted in plain text.
- There is **no self-service password reset** yet. If a member forgets their password, an admin can remove the account from the admin page and ask them to register again, or a reset flow can be added later.

### Admin management

The admin page is where all public site content is edited. It is protected by a passcode that lives only on the server (`ADMIN_PASSCODE` in `.env`), never in the website files.

1. **Open `/admin.html`** (there is also an **Admin** link in the footer of every page).
2. **Enter the admin passcode.** A correct passcode signs you in for **12 hours**; after that you'll be asked again. Use **Lock** (top-right) to sign out immediately.

From the panels you can edit:

- **Club info** — contact email, location, and meeting note shown in the footer of every page.
- **Homepage stats** — the four figures under the homepage hero (e.g. active members, established year).
- **Executive council** — each officer's name and duty, plus their **portrait** (click **Photo**).
- **Gallery events** — add, edit, or remove events and set each event's **photo**.
- **Upcoming activities** — the short list shown on the member dashboard.
- **Yearly calendar** — set the year and add/edit/remove the year's programmes (month, date, title, description, category, and Completed/Upcoming status). This drives the public **Calendar** page.
- **Registered members** — view everyone who has signed up, **Refresh** the list, or remove a member.

How saving works:

- **Photos save immediately** when you pick them — they are uploaded to the website (stored in the database and cached on disk) and appear wherever they're linked. After adding photos, still click **Save Changes** so the content that references them is saved too.
- **Text and settings** (everything except photos) are saved to the database only when you click **Save Changes**. A **Saved ✓** badge confirms it.
- **Download data.json** exports the current content as a backup file. If the database is ever unreachable, saving falls back to downloading this file.

Changing the admin passcode: edit `ADMIN_PASSCODE` in the server's `.env` file (or the host's environment settings) and restart the server. It is deliberately not editable from the web page.

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

4. Optional: `npm run seed` populates the database with the default site
   content and 8 sample member accounts (`@example.com` addresses,
   password `Welcome@123`). It never overwrites existing rows, so it is
   safe to run at any time; remove the samples from the admin page when
   real members sign up.

The startup log tells you whether the database and admin passcode are configured.

## Deploying

Any Node.js host works (Render, Railway, Fly.io, cPanel with Node support, etc.). Set `DATABASE_URL`, `ADMIN_PASSCODE`, and `SESSION_SECRET` in the host's environment settings instead of uploading `.env`. Only `server.js`, `server/`, `public/`, and `package.json` are needed in the deployment.

## Security notes

- `.env` is gitignored — keep it that way; it holds the database credential and admin passcode.
- The old admin passcode (`Akpodiete@321`) appeared in the public site files before this restructure. Change `ADMIN_PASSCODE` to a new value.
- There is no rate limiting on login attempts yet; consider adding it (or hosting behind a proxy that provides it) before the member base grows.
