# SCARS — Smart Campus Alert & Response System

**University of the Visayas Toledo Campus**
Campus safety and incident management platform — real-time reporting, response coordination, and analytics.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Role System](#role-system)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Real-time Events](#real-time-events)
- [Pages & Access](#pages--access)
- [Performance & Process Tuning](#performance--process-tuning)
- [Deployment — Hostinger Business](#deployment--hostinger-business)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Recharts 3, Lucide React |
| Backend | Express.js 5, Node.js 20+ (ESM) |
| Database | MySQL 8+ via mysql2 (Prisma CLI for schema management only) |
| Real-time | Socket.io 4 (polling-first for shared hosting compatibility) |
| Auth | JWT + bcryptjs 3 |
| Build | Vite 8 → output to `backend/public/` |
| Notifications | Nodemailer (email) + Twilio (SMS, lazy-loaded) |

---

## Features

### Incident Management
- Full lifecycle: **Report → Validate → Verify → Assign Team → Resolve**
- Incidents cannot be resolved unless **Validated**, **Verified**, and assigned to a response team (full words shown in progress indicators)
- Active and Resolved sub-tabs with separate views
- All reports show **submitter name** and **full timestamp** across every dashboard

### Response Management
- **Personnel tab** — browse all Officers and Responders with team assignments
- **Teams tab** — roster view; create/edit teams with member picker; team status **dynamically reflects active incident assignments** (auto shows "On Duty" when team has active incidents)
- **Assignments tab** — unassigned and assigned incident cards with corrected status badges and team chips showing live dynamic status
- **Status Tracking tab** — active incidents with live status select; resolved incidents locked behind password confirmation; **Admin role bypasses the password check** entirely

### Dashboards (Role-Specific)
- **Admin** — system overview, incident stats, status breakdown, quick actions; status tracking resolved-incident reopen requires no password for Admin role
- **Officer** — active incidents with reporter name, timestamp, team assignment column, and full Validate/Verify action labels; sound alert on new incident
- **Responder** — team-assigned incidents shown **read-only** (no status editing, no delete); **All Recent Reports** section shows the latest 10 campus-wide reports; sound alert on new incident
- **Student** — report an incident; track submitted reports with full timestamps; Campus Alerts show title and message only (no type badge)

### Reporting & Analytics
- Filters to **Critical and High priority incidents only**
- **Overview** — KPI cards, pipeline progress rates, monthly area chart, priority bar chart, recent incidents
- **Incident Reports** — charts (by type, status donut, monthly trend, day-of-week, top locations, validation funnel) + filterable data table with CSV export
- **Response Metrics** — team performance bar chart, resolution rate progress bars, team summary table, personnel directory
- **Export** — filter by date range, type, status, priority; download as CSV

### FAQ & Help
- Searchable accordion FAQ organized by role (Students, Officers, Responders, General, Notifications, Reports)
- Role-specific quick-help tips shown based on the logged-in user's role
- Emergency contacts and support resources
- Accessible from sidebar for all roles at `/faq`

### System
- Real-time updates via Socket.io — every mutation is broadcast to all clients; duplicate-safe (socket-only state update, no race condition)
- Role-based notifications — bell panel filtered per role with unread badge and ring animation; **panel is 420 px wide on desktop**, all items are **clickable** (routes to Notification System or Incidents page)
- **Incident alerts in bell panel** — when a new incident is created, Officers and Admins see an in-app alert in the bell dropdown with a "View Incident" link
- **Sound alerts** — new incidents trigger a Web Audio API tone based on priority (Critical = urgent triple beep, High = double beep, others = single tone); plays for Officers and Admins
- Profile management — edit name, email, password, and photo; optional Face++ face verification
- Dynamic branding — admin uploads logo; updates favicon, tab title, sidebar, login screen, and loading screen
- TTL in-memory cache (max 100 entries) with auto-eviction and pattern-based purge
- gzip compression on all API responses (~70% payload reduction)
- Request deduplication — concurrent identical GET requests share a single network call
- Mobile-responsive with touch-friendly tap targets

---

## Role System

| Role | Level | Dashboard | Incidents | Response | Notifications | Reports | Admin |
|---|---|---|---|---|---|---|---|
| Admin | 1 | `/dashboard` | Full | Full + bypass password | Full | Full (Critical+High) | Full |
| Officer | 2 | `/officer` | Validate/Verify/Assign + sound alerts | View/Assign | Sound alerts | View (Critical+High) | — |
| Responder | 3 | `/responder` | View only (no edit/delete) + All Reports | View + sound alerts | Receive | — | — |
| Student | 4 | `/student` | Report only | — | No type badge in alerts | — | — |

Login automatically redirects each role to their dashboard.

---

## Project Structure

```
scars/
├── frontend/                      React + Vite
│   ├── src/
│   │   ├── components/            Header, Sidebar, Layout, LoadingScreen, BrandingManager
│   │   ├── context/AppContext.jsx  Global state, auth, Socket.io listeners
│   │   ├── pages/                 All page components (one per route)
│   │   │   └── FaqHelp.jsx        FAQ & Help page (all roles)
│   │   └── services/api.js        Fetch API client with request deduplication
│   ├── static/.htaccess           SPA routing + API proxy
│   ├── index.html
│   ├── vite.config.js             Dev proxy → :3001 | prod build → ../backend/public/
│   └── package.json
│
├── backend/                       Express + mysql2 REST API
│   ├── server/
│   │   ├── index.js               Entry point; serves backend/public/ in production
│   │   ├── lib/db.js              mysql2 pool (connectionLimit: 4) + row mappers
│   │   ├── lib/cache.js           TTL in-memory cache (max 100 entries)
│   │   ├── lib/notify.js          Email (Nodemailer) + SMS (Twilio, lazy-loaded)
│   │   ├── lib/socket.js          Shared Socket.io emit helper
│   │   ├── middleware/auth.js     JWT verification middleware
│   │   └── routes/                auth, users, roles, teams, incidents,
│   │                              notifications, admin, profile
│   ├── prisma/
│   │   ├── schema.prisma          MySQL schema (Prisma CLI only — not used at runtime)
│   │   ├── seed.js                Seed script (mysql2)
│   │   ├── create-tables.sql      CREATE TABLE statements for phpMyAdmin import
│   │   └── seed.sql               Ready-to-import SQL for phpMyAdmin
│   ├── .env                       Local secrets — never commit
│   ├── .env.example               Template
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Local Development

### Prerequisites

- **Node.js 20+** — verify with `node -v`
- **MySQL 8+** — [XAMPP](https://www.apachefriends.org/) is the easiest local option

### Setup

**Terminal 1 — Backend**

```bash
git clone <repo-url>
cd scars/backend
npm install
cp .env.example .env      # fill in local MySQL credentials
npm run db:push           # create all tables
npm run db:seed           # seed default roles, teams, accounts
npm run dev               # Express on http://localhost:3001
```

**Terminal 2 — Frontend**

```bash
cd scars/frontend
npm install
npm run dev               # Vite on http://localhost:5173
```

| URL | Purpose |
|---|---|
| `http://localhost:5173` | App (Vite dev server, hot reload) |
| `http://localhost:3001/api/health` | Health check — `{ ok, db, cache, jwt }` |

### Default Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@uv.edu.ph | admin123 |
| Officer | officer@uv.edu.ph | off123 |
| Responder | responder@uv.edu.ph | resp123 |
| Student | ana.santos@uv.edu.ph | student123 |

> **Change all passwords before going live.**

---

## Environment Variables

**Local:** `backend/.env` (copy from `backend/.env.example`).
**Hostinger:** set in hPanel → Node.js → Environment Variables — do **not** upload a `.env` file.

### MySQL Connection

| Variable | Local (XAMPP) | Hostinger |
|---|---|---|
| `MYSQL_HOST` | `127.0.0.1` | *(omit — use socket)* |
| `MYSQL_PORT` | `3306` | *(omit — use socket)* |
| `MYSQL_USER` | `root` | `u856082912_scars` |
| `MYSQL_PASSWORD` | *(blank)* | your MySQL password |
| `MYSQL_DATABASE` | `scars_db` | `u856082912_scars_db` |
| `MYSQL_SOCKET` | *(omit)* | `/var/lib/mysql/mysql.sock` |

> Hostinger shared hosting requires Unix socket connections. Set `MYSQL_SOCKET` and omit `MYSQL_HOST`/`MYSQL_PORT`.

### Other Variables

| Variable | Local | Hostinger |
|---|---|---|
| `DATABASE_URL` | `mysql://root:@127.0.0.1:3306/scars_db` | *(Prisma CLI only — not used at runtime)* |
| `JWT_SECRET` | any string | `openssl rand -hex 32` |
| `PORT` | `3001` | `3001` |
| `NODE_ENV` | `development` | `production` |
| `FRONTEND_URL` | `http://localhost:5173` | `https://uv-scars.com` |
| `UV_THREADPOOL_SIZE` | *(omit)* | `2` |
| `SMTP_HOST` | *(blank — email disabled)* | your SMTP server |
| `SMTP_PORT` | *(blank)* | `587` |
| `SMTP_USER` | *(blank)* | your email address |
| `SMTP_PASS` | *(blank)* | your email password |
| `TWILIO_ACCOUNT_SID` | *(blank — SMS disabled)* | your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | *(blank)* | your Twilio Auth Token |
| `TWILIO_FROM` | *(blank)* | your Twilio phone number |
| `FACEPP_API_KEY` | *(blank — optional)* | Face++ API key |
| `FACEPP_API_SECRET` | *(blank — optional)* | Face++ API secret |

> Email and SMS delivery are skipped automatically when credentials are not set — the app still works fully without them.

---

## Database

All commands run from `backend/`. Prisma CLI manages the schema — all runtime queries use mysql2 directly.

```bash
npm run db:push      # sync schema → MySQL (create/update tables)
npm run db:seed      # seed default roles, teams, and accounts
npm run db:studio    # open Prisma Studio visual browser
npm run db:reset     # drop all data and re-apply schema + seed
```

### phpMyAdmin Import (Hostinger)

1. Import `prisma/create-tables.sql` — creates all tables
2. Generate seed data locally:
   ```bash
   cd backend && node prisma/make-seed-sql.js
   ```
3. Import the generated `prisma/seed.sql` via phpMyAdmin

---

## Scripts

### `cd frontend`

| Command | Action |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Production build → `../backend/public/` |
| `npm run preview` | Preview production build locally |

### `cd backend`

| Command | Action |
|---|---|
| `npm run dev` | Express + nodemon on :3001 |
| `npm start` | Production start (`UV_THREADPOOL_SIZE=2 node --max-old-space-size=256`) |
| `npm run build:frontend` | Install frontend deps + build into `backend/public/` |
| `npm run deploy` | Build frontend into `backend/public/` |
| `npm run db:push` | Sync schema to MySQL |
| `npm run db:seed` | Seed data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Drop + re-migrate + seed |

---

## API Reference

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → `{ token, user }` |
| GET | `/api/auth/me` | Get current user from token |
| POST | `/api/auth/verify-password` | Verify the authenticated user's password |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Incidents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/incidents` | List all incidents |
| POST | `/api/incidents` | Create incident (socket broadcasts to all clients) |
| PUT | `/api/incidents/:id` | Update incident |
| DELETE | `/api/incidents/:id` | Delete incident |
| PATCH | `/api/incidents/:id/validate` | Mark as validated |
| PATCH | `/api/incidents/:id/verify` | Mark as verified (approved) |
| PATCH | `/api/incidents/:id/assign` | Assign to a response team |

### Teams

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teams` | List teams with members |
| POST | `/api/teams` | Create team |
| PUT | `/api/teams/:id` | Update team + members |
| DELETE | `/api/teams/:id` | Delete team |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List all notifications |
| POST | `/api/notifications` | Send notification (triggers email/SMS if configured) |
| DELETE | `/api/notifications/:id` | Delete notification |

### Roles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/roles` | List roles by level |
| POST | `/api/roles` | Create role |
| PUT | `/api/roles/:id` | Update role and permissions |
| DELETE | `/api/roles/:id` | Delete role |

### Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Get current user's profile |
| PUT | `/api/profile` | Update name / email / password / photo |
| POST | `/api/profile/verify-face` | Face++ face check |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/system-config` | Get site name, logo, timezone |
| PUT | `/api/admin/system-config` | Update site name, logo, timezone |
| GET | `/api/admin/backup-config` | Get backup settings |
| PUT | `/api/admin/backup-config` | Update backup settings |
| GET | `/api/health` | `{ ok, db, cache, jwt, env, time }` |

---

## Real-time Events

Socket.io broadcasts after every mutation. `AppContext` patches client state instantly — no page reload needed.
State updates are socket-only (no duplicate optimistic updates from HTTP responses).

| Event | Trigger |
|---|---|
| `incident:created` / `incident:updated` / `incident:deleted` | Any incident change |
| `user:created` / `user:updated` / `user:deleted` | Any user change |
| `notification:sent` / `notification:deleted` | Notification created or removed |
| `team:updated` / `team:deleted` | Team change |
| `role:updated` / `role:deleted` | Role change |

---

## Pages & Access

| Page | Route | Access |
|---|---|---|
| Login | `/` | Public |
| Admin Dashboard | `/dashboard` | Admin |
| Officer Dashboard | `/officer` | Officer |
| Responder Dashboard | `/responder` | Responder |
| Student Dashboard | `/student` | Student |
| Profile | `/profile` | All roles |
| FAQ & Help | `/faq` | All roles |
| User Management | `/users` | Admin |
| Incident Management | `/incidents` | Admin, Officer |
| Response Management | `/response` | Admin, Officer, Responder |
| Notification System | `/notifications` | Admin, Responder |
| Reporting & Analytics | `/reports` | Admin, Officer |
| System Administration | `/admin` | Admin |

---

## Performance & Process Tuning

### Hostinger Process Budget

Target: **< 40 OS threads/processes**. Estimated actual usage: **~8–12 threads** at idle.

| Setting | Value | Location |
|---|---|---|
| `UV_THREADPOOL_SIZE` | `2` | hPanel env var + `npm start` |
| `--max-old-space-size` | `256 MB` | `npm start` script |
| MySQL `connectionLimit` | `4` | `lib/db.js` |
| MySQL `maxIdle` | `2` | `lib/db.js` |
| MySQL `idleTimeout` | `30 s` | `lib/db.js` |
| MySQL `queueLimit` | `10` | `lib/db.js` |
| Socket.io `pingTimeout` | `15 s` | `server/index.js` |
| Socket.io `maxHttpBufferSize` | `100 KB` | `server/index.js` |
| Cache `MAX_ENTRIES` | `100` | `lib/cache.js` |
| Twilio SDK | Lazy-loaded on first SMS | `lib/notify.js` |
| Express body limit | `1 MB` (API) / `20 MB` (image routes) | `server/index.js` |

### Backend Optimizations

| Optimization | Details |
|---|---|
| **gzip compression** | `compression({ level: 6, threshold: 1024 })` on all responses |
| **Database indexes** | Indexes on `Incident(status, type, priority, createdAt, assignedToId)`, `Notification(target, sentAt)`, `User(status, roleId)` |
| **Auth JOIN queries** | Login + `/me` use `USER_ROLE_SELECT` join — eliminates a separate Role lookup |
| **Teams parallel queries** | Member and incident queries run via `Promise.all()` |
| **TTL cache** | 100-entry cap; expired entries evicted on insert |
| **Static asset caching** | `maxAge: '1d', immutable` for hashed Vite bundles |
| **SPA fallback** | `existsSync` called once at startup, not on every request |

### Frontend Optimizations

| Optimization | Details |
|---|---|
| **Request deduplication** | Concurrent identical GET requests share one `fetch()` promise |
| **Memoized analytics** | All chart aggregations in `useMemo` — single pass over incidents array |
| **Socket-only state updates** | `addIncident` / other mutations do not set state directly; socket event is the single source of truth — eliminates duplicate entries |

### Database Indexes

Already included in `create-tables.sql`. Run on existing databases:

```sql
CREATE INDEX idx_incident_status     ON Incident (status);
CREATE INDEX idx_incident_type       ON Incident (type);
CREATE INDEX idx_incident_priority   ON Incident (priority);
CREATE INDEX idx_incident_created    ON Incident (createdAt);
CREATE INDEX idx_incident_assigned   ON Incident (assignedToId, status);
CREATE INDEX idx_notification_target ON Notification (target);
CREATE INDEX idx_notification_sent   ON Notification (sentAt);
CREATE INDEX idx_user_status         ON User (status);
CREATE INDEX idx_user_roleId         ON User (roleId);
```

---

## Deployment — Hostinger Business

**Architecture:** `frontend/` builds into `backend/public/`. Express serves both the API and the React SPA. Apache reverse-proxies the domain to Express on port 3001.

> `npm` is not on the SSH PATH — always use the **"Run NPM command"** field in hPanel → Node.js panel.

### Database Credentials (Hostinger)

| Field | Value |
|---|---|
| Name | `u856082912_scars_db` |
| User | `u856082912_scars` |
| Host | `localhost` (socket) |

---

### Step 1 — Add Website

hPanel → **Websites** → **Add Website** → choose **Node.js Web App** → enter `uv-scars.com`.

---

### Step 2 — Connect Git Repository

Select **Git repository** → authorize Hostinger → select the **scars** repo, branch `main`.

---

### Step 3 — Build Settings

| Setting | Value |
|---|---|
| Framework preset | `Express` |
| Node.js version | `20.x` |
| Root directory | `backend` |
| Build command | `npm run build:frontend` |
| Entry file | `server/index.js` |

---

### Step 4 — Environment Variables

| Key | Value |
|---|---|
| `MYSQL_USER` | `u856082912_scars` |
| `MYSQL_PASSWORD` | your MySQL password |
| `MYSQL_DATABASE` | `u856082912_scars_db` |
| `MYSQL_SOCKET` | `/var/lib/mysql/mysql.sock` |
| `JWT_SECRET` | output of `openssl rand -hex 32` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://uv-scars.com` |
| `UV_THREADPOOL_SIZE` | `2` |

Click **Deploy**.

---

### Step 5 — Create Tables

hPanel → Node.js panel → **Run NPM command**: `run db:push`

---

### Step 6 — Seed the Database

**Option A — phpMyAdmin (recommended):**

1. Locally: `cd backend && node prisma/make-seed-sql.js`
2. hPanel → **Databases** → **phpMyAdmin** → `u856082912_scars_db` → **Import** → `prisma/seed.sql` → **Go**

**Option B — NPM command:** `run db:seed`

---

### Step 7 — Verify

| URL | Expected |
|---|---|
| `https://uv-scars.com` | Login page loads |
| `https://uv-scars.com/api/health` | `{ "ok": true, "db": "connected" }` |

---

### Updating

Push to the tracked branch — Hostinger auto-deploys. If `prisma/schema.prisma` changed, run `db:push` manually via SSH after deploy (Prisma is a dev-only CLI tool and does not run during `npm install`).

---

## License

Project use only — University of the Visayas Toledo Campus.
