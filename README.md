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
| Frontend | React 18, React Router v6, Recharts, Lucide React |
| Backend | Express.js, Node.js 18+ (ESM) |
| Database | MySQL 8+ via Prisma ORM |
| Real-time | Socket.io 4 |
| Auth | JWT + bcryptjs |
| Build | Vite 5 |

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
- **Offline fallback** — mock data loads automatically when the database is unreachable

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
│   │   ├── services/api.js        Fetch API client
│   │   └── data/mockData.js       Offline fallback data
│   ├── static/.htaccess           SPA routing + API proxy (auto-copied into build)
│   ├── index.html
│   ├── vite.config.js             Dev proxy → :3001 | build → ../backend/public/
│   └── package.json
│
├── backend/                       Express + Prisma API
│   ├── server/
│   │   ├── index.js               Entry point; serves backend/public/ in production
│   │   ├── lib/prisma.js          Prisma client singleton
│   │   ├── lib/socket.js          Shared Socket.io emit helper
│   │   ├── middleware/auth.js     JWT middleware
│   │   └── routes/                auth, users, roles, teams, incidents,
│   │                              notifications, admin, profile
│   ├── prisma/
│   │   ├── schema.prisma          MySQL schema
│   │   ├── seed.js                Node seed script
│   │   ├── make-seed-sql.js       Generates seed.sql with bcrypt hashes (run locally)
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

- Node.js 18+
- MySQL 8+ — [XAMPP](https://www.apachefriends.org/) is the easiest option

### Setup

```bash
# Clone
git clone <repo-url>
cd scars

# Backend
cd backend
npm install
cp .env.example .env          # pre-filled for XAMPP defaults
npm run db:push               # create tables
npm run db:seed               # seed default accounts
npm run dev                   # Express on :3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # Vite on :5173
```

| URL | What |
|---|---|
| http://localhost:5173 | Frontend (Vite) |
| http://localhost:3001/api | API |
| http://localhost:3001/api/health | Health check |

> No MySQL? The app loads mock data automatically — reads work, writes fail gracefully.

---

## Environment Variables

File: `backend/.env` (local) — on Hostinger, set in hPanel → Node.js → Environment Variables instead.

```env
# Local (XAMPP):  mysql://root:@localhost:3306/scars_db
# Hostinger:      mysql://u856082912_scars:PASSWORD@localhost:3306/u856082912_scars_db
DATABASE_URL="mysql://root:@localhost:3306/scars_db"

JWT_SECRET="change-me"              # any string locally; openssl rand -hex 32 for prod
PORT=3001
NODE_ENV=development                # use "production" on Hostinger
FRONTEND_URL=http://localhost:5173  # use https://uv-scars.com on Hostinger

FACEPP_API_KEY=                     # optional — leave blank to skip face verification
FACEPP_API_SECRET=
```

---

## Database

All commands run from `backend/`.

```bash
npm run db:push      # sync schema → MySQL (no migration file)
npm run db:seed      # seed default roles, teams, and accounts
npm run db:studio    # Prisma Studio visual browser
npm run db:reset     # drop all data and re-migrate
```

### Default accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@uv.edu.ph | admin123 |
| Officer | officer@uv.edu.ph | off123 |
| Responder | responder@uv.edu.ph | resp123 |
| Student | ana.santos@uv.edu.ph | student123 |

> Change all passwords before going live.

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
| PUT | `/api/roles/:id` | Update permissions |

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
| GET | `/api/health` | `{ ok, env, time }` |

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

**How it works:** `frontend/` builds into `backend/public/`; Express serves both the API and the static frontend. Apache reverse-proxies the domain to Express on port 3001. `static/.htaccess` (copied at build time) handles SPA routing so page refreshes never 404.

> `npm` is not on the SSH PATH on shared hosting — use the **"Run NPM command"** field in the hPanel Node.js panel.

---

### Database (already created)

| Field | Value |
|---|---|
| Name | `u856082912_scars_db` |
| User | `u856082912_scars` |
| Host | `localhost` |
| Port | `3306` |

---

### Step 1 — Upload

**Git (recommended)**
```bash
# via SSH (search "SSH Access" in hPanel)
cd ~/domains/uv-scars.com
git clone <repo-url> scars
```

**File Manager** — zip the project (exclude `*/node_modules/` and `backend/public/`), upload and extract into `~/domains/uv-scars.com/scars/`.

---

### Step 2 — Create Node.js app in hPanel

Search **Node.js** in hPanel → **Create Application**:

| Setting | Value |
|---|---|
| Node.js version | `20.x` |
| Application mode | `Production` |
| Application root | `~/domains/uv-scars.com/scars/backend` |
| Application URL | `uv-scars.com` |
| Application startup file | `server/index.js` |

**Environment Variables:**

| Key | Value |
|---|---|
| `DATABASE_URL` | `mysql://u856082912_scars:PASSWORD@localhost:3306/u856082912_scars_db` |
| `JWT_SECRET` | long random string |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://uv-scars.com` |
| `FACEPP_API_KEY` | *(optional)* |
| `FACEPP_API_SECRET` | *(optional)* |

---

### Step 3 — Install, build, seed

In the **"Run NPM command"** field:

| Command | What it does |
|---|---|
| `install` | installs backend deps + `prisma generate` |
| `run build:frontend` | installs frontend deps + builds → `backend/public/` |
| `run db:push` | creates all MySQL tables |

**Seed — pick one:**

- **phpMyAdmin** *(recommended)* — run `node backend/prisma/make-seed-sql.js` locally → import `backend/prisma/seed.sql` via hPanel → Databases → phpMyAdmin → Import
- **Node.js panel** — Run NPM command: `run db:seed`

---

### Step 4 — Start

Click **Restart** in the Node.js panel.

- `https://uv-scars.com` → login page
- `https://uv-scars.com/api/health` → `{ "ok": true }`

---

### Updating

```
git pull (SSH)  →  install  →  run build:frontend  →  run db:push (if schema changed)  →  Restart
```

---

## License

Internal use — University of the Visayas Toledo Campus.
