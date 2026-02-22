# British Flight Center Website + Admin CRM

This project now runs as a Node.js app with:
- Public website pages (`index.html`, `booking.html`, `contact.html`, `fleet.html`, `inspections.html`)
- Submission API for booking/contact forms
- SQLite storage
- Admin CRM dashboard (`/admin`) with login, filters, status workflow, notes, and CSV export

## Stack
- Node.js + Express
- SQLite (`better-sqlite3`)
- Session auth (`express-session` + `connect-sqlite3`)
- Validation (`zod`)
- Notifications (`nodemailer` via SMTP)

## Quick Start
1. Install dependencies:
```bash
npm ci
```

2. Create env file:
```bash
cp .env.example .env
```
Set at minimum:
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`)

3. Run migrations + seed admin:
```bash
npm run migrate
```

4. Start server:
```bash
npm start
```

App runs at `http://127.0.0.1:5173` by default.

## Admin
- Login page: `http://127.0.0.1:5173/admin/login.html`
- Protected dashboard: `http://127.0.0.1:5173/admin`

## API
### Public
- `POST /api/submissions/booking`
- `POST /api/submissions/contact`

### Admin
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout` (CSRF required)
- `GET /api/admin/submissions`
- `GET /api/admin/submissions/:id`
- `PATCH /api/admin/submissions/:id` (CSRF required)
- `GET /api/admin/submissions/export.csv`

## Deployment (VPS)
1. Install Node LTS and Nginx.
2. Configure `.env`.
3. Run:
```bash
npm ci
npm run migrate
npm start
```
4. Put behind Nginx reverse proxy + TLS.
5. Configure SMTP env vars for notifications.
6. Schedule daily backup of `data/*.sqlite`.
