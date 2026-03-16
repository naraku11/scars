# UV SCARS — Smart Campus Alert & Response System

Real-time campus safety and incident management for the **University of the Visayas Toledo Campus**.
**Live:** https://uv-scars.com

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
- [Pages](#pages)
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

---

## Features

- **Role-based dashboards** — Admin, Officer, Responder, and Student each get a tailored UI
- **Incident lifecycle** — report → validate → verify → assign team → resolve
- **Real-time updates** — Socket.io pushes every mutation to all connected clients instantly
- **Role-targeted notifications** — bell panel filtered per role; unread badge with ring animation
- **Profile management** — edit name, email, password, photo; optional Face++ face verification
- **Dynamic branding** — admin uploads logo; updates favicon, tab title, sidebar, login, and loading screen live
- **Reporting & analytics** — bar, pie, and line charts with CSV export
- **Responsive** — mobile-friendly; swipeable sidebar on small screens
- **In-memory cache** — TTL cache per resource (roles 5 min, users 60s, incidents 30s) with mutation invalidation

---

## Role System

| Role | Level | Dashboard | Incidents | Response | Notifications | Reports | Admin |
|---|---|---|---|---|---|---|---|
| Admin | 1 | `/dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Officer | 2 | `/officer` | ✓ | ✓ | — | ✓ | — |
| Responder | 3 | `/responder` | ✓ | ✓ | ✓ | — | — |
| Student | 4 | `/student` | ✓ report only | — | — | — | — |

Login redirects each role to their dashboard automatically.

---

## Project Structure

```
scars/
├── frontend/                      React + Vite
│   ├── src/
│   │   ├── components/            Header, Sidebar, Layout, LoadingScreen, BrandingManager
│   │   ├── context/AppContext.jsx  Global state, auth, Socket.io listeners
│   │   ├── pages/                 All page components
│   │   └── services/api.js        Fetch API client
│   ├── static/.htaccess           SPA routing + API proxy (auto-copied into build)
│   ├── index.html
│   ├── vite.config.js             Dev proxy → :3001 | build → ../backend/public/
│   └── package.json
│
├── backend/                       Express + mysql2 API
│   ├── server/
│   │   ├── index.js               Entry point; serves backend/public/ in production
│   │   ├── lib/db.js              mysql2 pool + row mappers + helpers
│   │   ├── lib/cache.js           TTL in-memory cache
│   │   ├── lib/socket.js          Shared Socket.io emit helper
│   │   ├── middleware/auth.js     JWT middleware
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

- **Node.js 20+** — `node -v`; install from [nodejs.org](https://nodejs.org/)
- **MySQL 8+** — [XAMPP](https://www.apachefriends.org/) is the easiest option

### Setup

**Terminal 1 — Backend**

```bash
git clone <repo-url>
cd scars/backend
npm install
cp .env.example .env   # edit with your local MySQL credentials
npm run db:push        # create all tables
npm run db:seed        # seed default roles, teams, accounts
npm run dev            # Express on http://localhost:3001
```

**Terminal 2 — Frontend**

```bash
cd scars/frontend
npm install
npm run dev            # Vite on http://localhost:5173
```

| URL | Purpose |
|---|---|
| `http://localhost:5173` | App (Vite, hot reload) |
| `http://localhost:3001/api` | API root |
| `http://localhost:3001/api/health` | Health check |

### Default accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@uv.edu.ph | admin123 |
| Officer | officer@uv.edu.ph | off123 |
| Responder | responder@uv.edu.ph | resp123 |
| Student | ana.santos@uv.edu.ph | student123 |

> Change all passwords before going live.

---

## Environment Variables

**Local:** `backend/.env` (copy from `backend/.env.example`).
**Hostinger:** set in hPanel → Node.js → Environment Variables — do **not** upload a `.env` file.

### MySQL connection

Use individual `MYSQL_*` vars — avoids URL special-character encoding issues with passwords.

| Variable | Local (XAMPP) | Hostinger |
|---|---|---|
| `MYSQL_HOST` | `127.0.0.1` | *(not needed — use socket)* |
| `MYSQL_PORT` | `3306` | *(not needed — use socket)* |
| `MYSQL_USER` | `root` | `u856082912_scars` |
| `MYSQL_PASSWORD` | *(blank)* | your MySQL password |
| `MYSQL_DATABASE` | `scars_db` | `u856082912_scars_db` |
| `MYSQL_SOCKET` | *(not set)* | `/var/lib/mysql/mysql.sock` |

> **Hostinger note:** MySQL on shared hosting only accepts Unix socket connections. Set `MYSQL_SOCKET` to the socket path and omit `MYSQL_HOST` / `MYSQL_PORT`.

### Other variables

| Variable | Local | Hostinger |
|---|---|---|
| `DATABASE_URL` | `mysql://root:@127.0.0.1:3306/scars_db` | *(Prisma CLI only — not used at runtime)* |
| `JWT_SECRET` | any string | `openssl rand -hex 32` output |
| `PORT` | `3001` | `3001` |
| `NODE_ENV` | `development` | `production` |
| `FRONTEND_URL` | `http://localhost:5173` | `https://uv-scars.com` |
| `FACEPP_API_KEY` | *(blank)* | *(optional)* |
| `FACEPP_API_SECRET` | *(blank)* | *(optional)* |

---

## Database

All commands run from `backend/`. Prisma CLI manages the schema — all runtime queries use mysql2 directly.

```bash
npm run db:push      # sync schema → MySQL (creates/updates tables)
npm run db:seed      # seed default roles, teams, and accounts
npm run db:studio    # open Prisma Studio visual browser
npm run db:reset     # drop all data and re-apply schema
```

### phpMyAdmin import (Hostinger)

1. Import `prisma/create-tables.sql` — creates all tables
2. Generate seed data locally:
   ```bash
   cd backend
   node prisma/make-seed-sql.js
   ```
3. Import the generated `prisma/seed.sql`

---

## Scripts

### `cd frontend`

| Command | Action |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Build → `../backend/public/` |
| `npm run preview` | Preview production build locally |

### `cd backend`

| Command | Action |
|---|---|
| `npm run dev` | Express + nodemon on :3001 |
| `npm start` | Express production start |
| `npm run build:frontend` | Install frontend deps + build into `backend/public/` |
| `npm run deploy` | prisma generate → db push → seed → build frontend |
| `npm run db:push` | Sync schema to MySQL |
| `npm run db:seed` | Seed data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Drop + re-migrate |

---

## API Reference

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → `{ token, user }` |
| GET | `/api/auth/me` | Current user from token |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all |
| POST | `/api/users` | Create |
| PUT | `/api/users/:id` | Update |
| DELETE | `/api/users/:id` | Delete |

### Incidents
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/incidents` | List all |
| POST | `/api/incidents` | Create |
| PUT | `/api/incidents/:id` | Update |
| DELETE | `/api/incidents/:id` | Delete |
| PATCH | `/api/incidents/:id/validate` | Mark validated |
| PATCH | `/api/incidents/:id/verify` | Mark verified |
| PATCH | `/api/incidents/:id/assign` | Assign to team |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List all |
| POST | `/api/notifications` | Send |
| DELETE | `/api/notifications/:id` | Delete |

### Teams
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teams` | List with members |
| POST | `/api/teams` | Create |
| PUT | `/api/teams/:id` | Update + members |
| DELETE | `/api/teams/:id` | Delete |

### Roles
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/roles` | List by level |
| POST | `/api/roles` | Create |
| PUT | `/api/roles/:id` | Update |
| DELETE | `/api/roles/:id` | Delete |

### Profile
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Get my profile |
| PUT | `/api/profile` | Update name / email / password / photo |
| POST | `/api/profile/verify-face` | Face++ face check |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET/PUT | `/api/admin/system-config` | Logo, site name, timezone |
| GET/PUT | `/api/admin/backup-config` | Backup settings |
| GET | `/api/health` | `{ ok, db, jwt, env, time }` |

---

## Real-time Events

Socket.io emits after every mutation; `AppContext` patches state instantly.

| Event | Trigger |
|---|---|
| `incident:created/updated/deleted` | Any incident change |
| `user:created/updated/deleted` | Any user change |
| `notification:sent/deleted` | Notification sent or removed |
| `team:updated/deleted` | Team change |
| `role:updated/deleted` | Role change |

---

## Pages

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

**How it works:** `frontend/` builds into `backend/public/`. Express serves both the API and the React app. Apache reverse-proxies the domain to Express on port 3001. Socket.io uses polling-first transport for shared hosting compatibility.

> `npm` is not on the SSH PATH — always use the **"Run NPM command"** field in hPanel → Node.js panel.

---

### Database credentials

| Field | Value |
|---|---|
| Name | `u856082912_scars_db` |
| User | `u856082912_scars` |
| Host | `localhost` |
| Port | `3306` |

---

### Step 1 — Add Website

hPanel → **Websites** → **Add Website**.

---

### Step 2 — Select Node.js Web App

Choose **Node.js Web App** as the website type.

---

### Step 3 — Choose domain

Enter `uv-scars.com` and continue.

---

### Step 4 — Select Git repository

Choose **Select Git repository**, authorize Hostinger, then select the **scars** repo and branch (`main`).

---

### Step 5 — Build settings

| Setting | Value |
|---|---|
| Framework preset | `Express` |
| Node.js version | `20.x` |
| Root directory | `backend` |
| Package manager | `npm` |
| Build command | `npm run build:frontend` |
| Entry file | `server/index.js` |

**Environment Variables:**

| Key | Value |
|---|---|
| `MYSQL_USER` | `u856082912_scars` |
| `MYSQL_PASSWORD` | your MySQL password |
| `MYSQL_DATABASE` | `u856082912_scars_db` |
| `MYSQL_SOCKET` | `/var/lib/mysql/mysql.sock` |
| `JWT_SECRET` | run `openssl rand -hex 32` and paste the result |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://uv-scars.com` |

Click **Deploy**.

---

### Step 6 — Create tables

hPanel → Node.js panel → **Run NPM command**:

```
run db:push
```

---

### Step 7 — Seed the database

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
| `https://uv-scars.com` | Login page |
| `https://uv-scars.com/api/health` | `{ "ok": true, "db": "connected" }` |

---

### Updating

Push to the tracked Git branch — Hostinger auto-deploys (or click **Redeploy** in the Websites panel).

If `prisma/schema.prisma` changed, run after deploy:

```
run db:push
```

---

## License

Project use only — University of the Visayas Toledo Campus.
