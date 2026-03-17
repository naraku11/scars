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
- [Deployment — Hostinger Business](#deployment--hostinger-business)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Recharts 3, Lucide React |
| Backend | Express.js 5, Node.js 20+ (ESM) |
| Database | MySQL 8+ via mysql2 (Prisma CLI for schema management) |
| Real-time | Socket.io 4 |
| Auth | JWT + bcryptjs 3 |
| Build | Vite 8 |
| Notifications | Nodemailer (email) + TextBelt (SMS) |

---

## Features

### Incident Management
- Full incident lifecycle: **Report → Validate → Verify → Assign Team → Resolve**
- Incidents cannot be resolved unless validated, verified (approved), and assigned to a response team
- Active and Resolved sub-tabs with separate views
- Resolved status changes require password verification (Admin/Officer/Responder)

### Response Management
- **Personnel tab** — browse all Officers and Responders with status and team assignment
- **Teams tab** — roster view showing members per team; create/edit teams with member picker
- **Assignments tab** — unassigned and assigned incident cards with team assignment controls
- **Status Tracking tab** — active incidents with live status select; resolved incidents locked behind password confirmation

### Dashboards (Role-Specific)
- **Admin** — system overview, incident stats, status breakdown, quick actions, recent activity
- **Officer** — active incidents table with team assignment column; locked when resolved
- **Responder** — personal assignment view; status update dropdown with resolution guards
- **Student** — report an incident; track submitted report status

### Reporting & Analytics
- **Overview** — 6 KPI cards, pipeline progress rates, monthly area chart, priority bar chart, recent incidents
- **Incident Reports** — 6 charts (by type, status donut, monthly trend, day-of-week, top locations, validation funnel) + filterable data table with CSV export
- **Response Metrics** — team performance bar chart, resolution rate progress bars, team summary table; personnel directory
- **Export** — filter by date range, type, status, priority; download as CSV

### System
- Real-time updates via Socket.io — every mutation is broadcast instantly to all clients
- Role-based notifications — bell panel filtered per role with unread badge and ring animation
- Profile management — edit name, email, password, and photo; optional Face++ face verification
- Dynamic branding — admin uploads logo; updates favicon, tab title, sidebar, login screen, and loading screen
- TTL in-memory cache per resource (roles 5 min, users 60 s, incidents 30 s) with mutation invalidation
- Mobile-responsive with touch-friendly tap targets across all pages

---

## Role System

| Role | Level | Dashboard | Incidents | Response | Notifications | Reports | Admin |
|---|---|---|---|---|---|---|---|
| Admin | 1 | `/dashboard` | Full | Full | Full | Full | Full |
| Officer | 2 | `/officer` | Validate/Verify/Assign | View/Assign | — | View | — |
| Responder | 3 | `/responder` | View/Update status | View/Assign | Receive | — | — |
| Student | 4 | `/student` | Report only | — | — | — | — |

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
│   │   └── services/api.js        Fetch API client (auth, users, incidents, etc.)
│   ├── static/.htaccess           SPA routing + API proxy (auto-copied into dist)
│   ├── index.html
│   ├── vite.config.js             Dev proxy → :3001 | prod build → ../backend/public/
│   └── package.json
│
├── backend/                       Express + mysql2 REST API
│   ├── server/
│   │   ├── index.js               Entry point; serves backend/public/ in production
│   │   ├── lib/db.js              mysql2 pool + row mappers
│   │   ├── lib/cache.js           TTL in-memory cache
│   │   ├── lib/notify.js          Email (Nodemailer) + SMS (TextBelt) helpers
│   │   ├── lib/socket.js          Shared Socket.io emit helper
│   │   ├── middleware/auth.js     JWT verification middleware
│   │   └── routes/                auth, users, roles, teams, incidents,
│   │                              notifications, admin, profile
│   ├── prisma/
│   │   ├── schema.prisma          MySQL schema (Prisma CLI only — not used at runtime)
│   │   ├── seed.js                Seed script (mysql2)
│   │   ├── make-seed-sql.js       Generates seed.sql with bcrypt hashes (run locally)
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
| `http://localhost:3001/api` | API root |
| `http://localhost:3001/api/health` | Health check endpoint |

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

Use individual `MYSQL_*` variables — avoids URL special-character encoding issues with passwords.

| Variable | Local (XAMPP) | Hostinger |
|---|---|---|
| `MYSQL_HOST` | `127.0.0.1` | *(omit — use socket)* |
| `MYSQL_PORT` | `3306` | *(omit — use socket)* |
| `MYSQL_USER` | `root` | `u856082912_scars` |
| `MYSQL_PASSWORD` | *(blank)* | your MySQL password |
| `MYSQL_DATABASE` | `scars_db` | `u856082912_scars_db` |
| `MYSQL_SOCKET` | *(omit)* | `/var/lib/mysql/mysql.sock` |

> Hostinger shared hosting only accepts Unix socket connections. Set `MYSQL_SOCKET` and omit `MYSQL_HOST`/`MYSQL_PORT`.

### Other Variables

| Variable | Local | Hostinger |
|---|---|---|
| `DATABASE_URL` | `mysql://root:@127.0.0.1:3306/scars_db` | *(Prisma CLI only — not used at runtime)* |
| `JWT_SECRET` | any string | `openssl rand -hex 32` |
| `PORT` | `3001` | `3001` |
| `NODE_ENV` | `development` | `production` |
| `FRONTEND_URL` | `http://localhost:5173` | `https://uv-scars.com` |
| `SMTP_HOST` | *(blank)* | your SMTP server |
| `SMTP_PORT` | *(blank)* | `587` |
| `SMTP_USER` | *(blank)* | your email address |
| `SMTP_PASS` | *(blank)* | your email password |
| `TEXTBELT_KEY` | *(blank)* | your TextBelt API key |
| `FACEPP_API_KEY` | *(blank)* | *(optional)* |
| `FACEPP_API_SECRET` | *(blank)* | *(optional)* |

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
   cd backend
   node prisma/make-seed-sql.js
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
| `npm start` | Production start |
| `npm run build:frontend` | Install frontend deps + build into `backend/public/` |
| `npm run deploy` | prisma generate → db:push → db:seed → build frontend |
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
| POST | `/api/incidents` | Create incident |
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
| POST | `/api/notifications` | Send notification (triggers email/SMS) |
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
| GET | `/api/health` | `{ ok, db, jwt, env, time }` |

---

## Real-time Events

Socket.io broadcasts after every mutation. `AppContext` patches client state instantly without a page reload.

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
| User Management | `/users` | Admin |
| Incident Management | `/incidents` | Admin, Officer |
| Response Management | `/response` | Admin, Officer, Responder |
| Notification System | `/notifications` | Admin, Responder |
| Reporting & Analytics | `/reports` | Admin, Officer |
| System Administration | `/admin` | Admin |

---

## Deployment — Hostinger Business

**Architecture:** `frontend/` builds into `backend/public/`. Express serves both the API and the React SPA. Apache reverse-proxies the domain to Express on port 3001. Socket.io uses polling-first transport for shared hosting compatibility.

> `npm` is not on the SSH PATH — always use the **"Run NPM command"** field in hPanel → Node.js panel.

### Database Credentials (Hostinger)

| Field | Value |
|---|---|
| Name | `u856082912_scars_db` |
| User | `u856082912_scars` |
| Host | `localhost` (socket) |
| Port | `3306` |

---

### Step 1 — Add Website

hPanel → **Websites** → **Add Website**

---

### Step 2 — Select Node.js Web App

Choose **Node.js Web App** as the website type.

---

### Step 3 — Choose Domain

Enter `uv-scars.com` and continue.

---

### Step 4 — Select Git Repository

Choose **Select Git repository**, authorize Hostinger, then select the **scars** repo and branch (`main`).

---

### Step 5 — Build Settings

| Setting | Value |
|---|---|
| Framework preset | `Express` |
| Node.js version | `20.x` |
| Root directory | `backend` |
| Package manager | `npm` |
| Build command | `npm run build:frontend` |
| Entry file | `server/index.js` |

**Environment Variables to set:**

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

Click **Deploy**.

---

### Step 6 — Create Tables

hPanel → Node.js panel → **Run NPM command**:

```
run db:push
```

---

### Step 7 — Seed the Database

**Option A — phpMyAdmin (recommended):**

1. Locally: `cd backend && node prisma/make-seed-sql.js`
2. hPanel → **Databases** → **phpMyAdmin** → `u856082912_scars_db` → **Import** → choose `prisma/seed.sql` → **Go**

**Option B — NPM command:**

```
run db:seed
```

---

### Step 8 — Verify

| URL | Expected |
|---|---|
| `https://uv-scars.com` | Login page loads |
| `https://uv-scars.com/api/health` | `{ "ok": true, "db": "connected" }` |

---

### Updating

Push to the tracked Git branch — Hostinger auto-deploys. Alternatively, click **Redeploy** in the Websites panel.

If `prisma/schema.prisma` changed, run after deploy:

```
run db:push
```

---

## License

Project use only — University of the Visayas Toledo Campus.
