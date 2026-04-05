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

---

## Features

### Incident Management

- Full lifecycle: **Report → Validate → Verify → Assign Team → In Progress → Resolve**
- Incidents **cannot be deleted once both validated and verified** — delete button is locked with a visual indicator
- Incidents **cannot be resolved** unless validated, verified, and assigned to a response team
- **Soft delete** — deleted incidents move to a "Deleted" tab; admins can **Restore** them at any time
- **Auto-assign response team** — matches team specialty to incident type (available teams prioritized); falls back to any available team, then any team; sets status to **In Progress** automatically
- Team dropdown shows **dynamic status** (On Duty / Available) and specialty per team
- Active, Resolved, and Deleted sub-tabs with separate views
- Status flow: `Open → In Progress → Resolved` · `Rejected` for invalid reports
- **Responders can mark incidents as Resolved** from their dashboard — requires the incident to be both validated and verified; shows an "Awaiting validation" lock label otherwise
- **Admin password required to reopen Resolved incidents** — Admin must enter their password for confirmation; all other roles see a disabled "Admin only — locked" button

### ETA (Estimated Time of Arrival)

- Admin sets ETA on assigned or active incidents from Response Management
- **Quick presets** — ASAP (2 min), 5 min, 10 min, 15 min, 30 min, 1 hr; or a custom `datetime-local` picker
- **Past dates blocked** — the datetime picker enforces a `min` of the current time; `handleSetEta` rejects any value ≤ now
- **Color-coded countdown** — green (> 10 min), amber (≤ 10 min), red (overdue)
- ETA is displayed on Responder Dashboard incident cards with an overdue `!` indicator
- ETA can be edited or cleared at any time; stored as `DATETIME NULL` in the `Incident` table

### Response Management

- **Personnel tab** — all Officers and Responders with team assignments and dynamic team status
- **Teams tab** — roster view (expandable member list); create/edit/delete teams with member picker; team status **dynamically shows "On Duty"** when the team has active assigned incidents
- **Assignments tab** — unassigned incidents show validation/verification badges and color-coded assign buttons (green = available); assigned incidents show team info, a **Reassign Team** button, and an **ETA setter** with quick presets and custom datetime
- **Status Tracking tab**
  - Active incidents: live status select, ETA display/edit, team info
  - Resolved incidents: locked; **Admin must enter their password to reopen** — no bypass; non-Admin roles see a disabled "Admin only — locked" button

### Notification System

- **In-app Web Push** — send alerts to targeted roles with 4 urgency types
- **Urgency types** — Emergency (red/Zap), Alert (amber/AlertTriangle), Warning (yellow/AlertTriangle), Info (blue/Info) — each with type-specific icon and color
- **Target audience** — All, Admin, Responders, Officers, Students
- **Character limits** — Title: 60 chars, Message: 280 chars with live counters (turns red at limit)
- **Live bell preview** — compose panel shows a real-time preview of how the notification will appear in the header bell
- **Notification history** — type-specific icon and color per entry, sent timestamp, target group
- **Admin-only delete controls**:
  - Individual trash icon on each history item
  - Checkbox selection per item with a Select All toggle in the header
  - "Delete (N)" button appears when any items are selected
  - "All" button deletes every notification at once
  - Bulk delete uses a single `DELETE /api/notifications` call (body: `{ ids: [...] }`)
- **Duplicate prevention** — `sendNotification` no longer calls `setNotifications` directly; the socket `notification:sent` event is the single source of truth (prevents double-entry when target is "All")

### Notification Bell (Header)

- Role-filtered notifications — DB notifications shown only if `target` matches the user's role or is "All"
- Unread badge with ring animation; **dismiss button always visible** (not hover-only) for touch compatibility
- **Clear All** button removes all visible notifications at once
- Incident alerts (non-Students): new incident → in-app bell alert with "View Incident" link
- Response alerts: Responders notified on team assignment; Admin/Officer notified on status changes
- `sessionStorage` persistence for incident alerts — survives page refresh; cleared on login/logout to prevent cross-user leakage
- `localStorage` dismissed/read ID persistence with **stale ID pruning** — IDs for deleted notifications are removed automatically
- **Sound alerts** (Web Audio API) — plays on new incidents for Officers/Admins/Responders:
  - Critical = urgent triple beep (880 → 1100 Hz, square wave)
  - High = double beep (660 Hz, sawtooth)
  - Medium/Low = single tone (sine)

### Dashboards (Role-Specific)

- **Admin** — system overview, incident stats, status breakdown, quick actions
- **Officer** — active incidents with reporter name, timestamp, team assignment; Validate/Approve/Reject actions; sound alert on new incident
- **Responder** — mobile-first, tab-based dashboard:
  - **My Incidents** — active (Open + In Progress) incidents assigned to the responder's team, sorted by priority; badge shows active count; "Mark as Resolved" action when validated + verified; ETA badge with countdown per card
  - **All Reports** — full history (all statuses) of incidents assigned to the team, sorted newest first; badge shows total team incident count
  - **My Team** — team details, member list, and recent notifications
  - Stats row: Assigned / Open / In Progress / Resolved counts (from all team incidents)
- **Student** — report incident; track submitted reports with timestamps; Campus Alerts show title and message only

### Reporting & Analytics

- **Overview** — KPI cards, pipeline progress, monthly area chart, priority bar chart, recent incidents
- **Incident Reports** — charts (by type, status donut, monthly trend, day-of-week, top locations, validation funnel) + filterable data table with CSV export
- **Response Metrics** — team performance, resolution rate progress bars, team summary, personnel directory
- **Export** — filter by date range, type, status, priority; download CSV
- Filters: Critical and High priority incidents highlighted

### Role & Permission Management

- Permissions stored per role: `incidents`, `response`, `notifications`, `reports`, `admin`
- **Sidebar navigation is fully dynamic** — built from live role permissions; changes take effect immediately for online users (no re-login required)
- **Route guards** — two layers:
  1. Permission guard — navigating to a route without the required permission redirects to the role's home dashboard
  2. Role-only guard — dashboard routes (`/dashboard`, `/officer`, `/responder`, `/student`) redirect if the role doesn't match exactly
- Live preview in System Administration — toggling a permission checkbox instantly shows which pages that role can access (before saving)
- Admin role is protected and cannot be edited
- **Responder permissions** — idempotent startup migration resets Responder to dashboard-only (`response: false`, `notifications: false`, `reports: false`) if an old seed had `response: true`

### FAQ & Help

- Role-specific FAQ — each section filtered to the logged-in user's role
- Searchable accordion organized by topic
- Role-specific quick-help tips
- Emergency contacts and support resources
- Accessible at `/faq` for all roles

### System

- Real-time via Socket.io — every mutation broadcast to all clients; duplicate-safe
- Profile management — edit name, email, password, and profile photo; optional Face++ face verification
- Dynamic branding — admin uploads logo; updates favicon, tab title, sidebar, login screen, and loading screen
- TTL in-memory cache (max 100 entries) with auto-eviction and pattern-based purge
- gzip compression on all API responses (~70% payload reduction)
- Request deduplication — concurrent identical GET requests share a single network call
- Schema migrations applied automatically at server startup (idempotent `ALTER TABLE IF NOT EXISTS`)
- Mobile-responsive with touch-friendly tap targets and overflow-safe CSS grid (`minmax(min(280px, 100%), 1fr)`)

---

## Role System

| Role | Level | Dashboard | Incidents | Response | Notifications | Reports | Admin |
|---|---|---|---|---|---|---|---|
| Admin | 1 | `/dashboard` | Full + delete lock | Full + ETA + admin-password reopen | Full + delete history | Full | Full |
| Officer | 2 | `/officer` | Validate/Approve/Assign + sound | View/Assign | Sound alerts | View | — |
| Responder | 3 | `/responder` | My Incidents / All Reports / My Team | View + Resolve own team incidents | — | — | — |
| Student | 4 | `/student` | Report only | — | — | — | — |

Login automatically redirects each role to their dashboard. Sidebar items and route access are dynamically controlled by the role's permission settings.

---

## Project Structure

```
scars/
├── frontend/                      React + Vite
│   ├── src/
│   │   ├── components/            Header, Sidebar, Layout, LoadingScreen, BrandingManager
│   │   ├── context/AppContext.jsx  Global state, auth, Socket.io listeners
│   │   ├── pages/                 All page components (one per route)
│   │   └── services/api.js        Fetch API client with request deduplication
│   ├── static/.htaccess           SPA routing + API proxy
│   ├── index.html
│   ├── vite.config.js             Dev proxy → :3001 | prod build → ../backend/public/
│   └── package.json
│
├── backend/                       Express + mysql2 REST API
│   ├── server/
│   │   ├── index.js               Entry point; auto-applies schema migrations at startup
│   │   ├── lib/db.js              mysql2 pool (connectionLimit: 4) + row mappers
│   │   ├── lib/cache.js           TTL in-memory cache (max 100 entries)
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
| `FACEPP_API_KEY` | *(blank — optional)* | Face++ API key |
| `FACEPP_API_SECRET` | *(blank — optional)* | Face++ API secret |

---

## Database

All commands run from `backend/`. Prisma CLI manages the schema — all runtime queries use mysql2 directly.

```bash
npm run db:push      # sync schema → MySQL (create/update tables)
npm run db:seed      # seed default roles, teams, and accounts
npm run db:studio    # open Prisma Studio visual browser
npm run db:reset     # drop all data and re-apply schema + seed
```

> **Schema migrations** are applied automatically each time the server starts via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Columns added this way: `deletedAt DATETIME`, `eta DATETIME`. No manual migration step required after deployment.

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
| GET | `/api/incidents` | List active incidents (excludes soft-deleted) |
| GET | `/api/incidents/deleted` | List soft-deleted incidents |
| POST | `/api/incidents` | Create incident |
| PUT | `/api/incidents/:id` | Update incident fields (including `eta`) |
| DELETE | `/api/incidents/:id` | Soft-delete (sets `deletedAt`; restorable) |
| PATCH | `/api/incidents/:id/restore` | Restore a soft-deleted incident |
| PATCH | `/api/incidents/:id/validate` | Mark as validated |
| PATCH | `/api/incidents/:id/verify` | Mark as verified (approved) |
| PATCH | `/api/incidents/:id/assign` | Assign to a response team; sets status → In Progress |

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
| POST | `/api/notifications` | Send notification (type, title, message, target, sentById) |
| DELETE | `/api/notifications/:id` | Delete single notification |
| DELETE | `/api/notifications` | Bulk delete — body: `{ ids: [1, 2, …] }` |

### Roles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/roles` | List roles by level |
| POST | `/api/roles` | Create role |
| PUT | `/api/roles/:id` | Update role name, description, and permissions |
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

| Event | Trigger |
|---|---|
| `incident:created` | New incident reported |
| `incident:updated` | Incident fields, status, assignment, ETA, or validation changed |
| `incident:deleted` | Incident soft-deleted — payload includes `{ id, incident }` |
| `incident:restored` | Soft-deleted incident restored — payload is the full incident |
| `user:created` / `user:updated` / `user:deleted` | Any user change |
| `notification:sent` | Notification created — single source of truth for state updates |
| `notification:deleted` | Single notification removed — payload `{ id }` |
| `team:updated` / `team:deleted` | Team change |
| `role:updated` / `role:deleted` | Role change — sidebar navigation updates live for affected users |

---

## Pages & Access

Access is controlled by the role's **permission settings** (configurable in System Administration). The table below reflects the default seed configuration.

| Page | Route | Default Access |
|---|---|---|
| Login | `/` | Public |
| Admin Dashboard | `/dashboard` | Admin only |
| Officer Dashboard | `/officer` | Officer only |
| Responder Dashboard | `/responder` | Responder only |
| Student Dashboard | `/student` | Student only |
| Profile | `/profile` | All roles |
| FAQ & Help | `/faq` | All roles |
| User Management | `/users` | Admin (`admin` permission) |
| Incident Management | `/incidents` | Admin, Officer, Responder, Student (`incidents` permission) |
| Response Management | `/response` | Admin, Officer (`response` permission) |
| Notification System | `/notifications` | Admin (`notifications` permission) |
| Reporting & Analytics | `/reports` | Admin, Officer (`reports` permission) |
| System Administration | `/admin` | Admin (`admin` permission) |

Navigating directly to a route without the required permission redirects to the role's home dashboard. Dashboard routes additionally enforce a role-exact match (e.g. an Officer navigating to `/dashboard` is redirected to `/officer`).

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
| Express body limit | `1 MB` (API) / `20 MB` (image routes) | `server/index.js` |

### Backend Optimizations

| Optimization | Details |
|---|---|
| **gzip compression** | `compression({ level: 6, threshold: 1024 })` on all responses |
| **Database indexes** | Indexes on `Incident(status, type, priority, createdAt, assignedToId)`, `Notification(target, sentAt)`, `User(status, roleId)` |
| **Auth JOIN queries** | Login + `/me` use `USER_ROLE_SELECT` join — eliminates a separate Role lookup |
| **TTL cache** | 100-entry cap; expired entries evicted on insert |
| **Static asset caching** | `maxAge: '1d', immutable` for hashed Vite bundles |
| **SPA fallback** | `existsSync` called once at startup, not on every request |
| **Schema migrations** | `ALTER TABLE IF NOT EXISTS` at startup — no manual migration step |

### Frontend Optimizations

| Optimization | Details |
|---|---|
| **Request deduplication** | Concurrent identical GET requests share one `fetch()` promise |
| **Memoized analytics** | All chart aggregations in `useMemo` — single pass over incidents array |
| **Socket-only state updates** | Mutations do not update state directly; socket event is the single source of truth (prevents race-condition duplicates) |
| **Live permission sync** | Sidebar reads from live `roles` state — permission changes propagate without re-login |
| **Overflow-safe grids** | CSS `minmax(min(280px, 100%), 1fr)` prevents horizontal overflow on narrow screens |

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

Push to the tracked branch — Hostinger auto-deploys. Schema migrations (new columns) are applied automatically on next server start.

---

## License

Project use only — University of the Visayas Toledo Campus.
