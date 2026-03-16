# UV SCARS — Smart Campus Alert & Response System

A real-time campus safety and incident management web application for the **University of the Visayas Toledo Campus**. SCARS enables students to report incidents, officers to validate and coordinate responses, and administrators to manage the entire campus safety ecosystem.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Role System](#role-system)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Real-time Events](#real-time-events)
- [Pages Overview](#pages-overview)
- [Deployment — Hostinger Business](#deployment--hostinger-business)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Recharts |
| Backend | Express.js (Node.js 18+, ESM) |
| Database | MySQL 8+ via Prisma ORM |
| Real-time | Socket.io 4 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Build | Vite 5 |
| Dev tools | Nodemon, Concurrently |
| Icons | Lucide React |

---

## Features

- **Role-based dashboards** — each role gets its own tailored UI (Admin, Officer, Responder, Student)
- **Real-time updates** — Socket.io broadcasts all data mutations instantly to every connected client
- **Incident lifecycle** — report → validate → verify → assign team → resolve
- **Multi-channel notifications** — send alerts to specific role groups; bell panel is filtered per role
- **Profile management** — editable name, email, password, and profile photo with optional Face++ face verification
- **Dynamic branding** — admin can upload a custom logo and site name; updates favicon, browser tab title, sidebar, login page, and loading screen live
- **Reporting & analytics** — bar, pie, and line charts with CSV export
- **Smooth animations** — page transitions, branded loading splash screen, and UI micro-animations
- **Responsive / swipable** — works on desktop and mobile; sidebar slides in on small screens
- **Protected admin rows** — the Admin account cannot be edited or deleted from User Management
- **Production-ready** — single Express process serves both the API and the React build; offline mock fallback when API is unavailable

---

## Role System

Four roles in hierarchical order (lower level = higher authority):

| Role | Level | Dashboard | Incidents | Response | Notifications | Reports | Admin |
|---|---|---|---|---|---|---|---|
| Admin | 1 | `/dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Officer | 2 | `/officer` | ✓ | ✓ | — | ✓ | — |
| Responder | 3 | `/responder` | ✓ | ✓ | ✓ | — | — |
| Student | 4 | `/student` | ✓ (report only) | — | — | — | — |

Login automatically redirects each role to their dashboard. The notification bell only shows alerts addressed to the user's role or `All`.

---

## Project Structure

```
scars/
├── frontend/                        # React + Vite app
│   ├── src/
│   │   ├── components/              # Header, Sidebar, Layout, LoadingScreen, BrandingManager
│   │   ├── context/AppContext.jsx   # Global state, auth, Socket.io listeners
│   │   ├── pages/                   # Login, Dashboard, role dashboards, Profile, admin pages
│   │   ├── services/api.js          # Fetch-based API client
│   │   └── data/mockData.js         # Offline fallback data
│   ├── static/
│   │   └── .htaccess                # SPA routing + API proxy (copied into build output)
│   ├── index.html
│   ├── vite.config.js               # Dev proxy → :3001; build → ../backend/public/
│   └── package.json                 # Frontend-only deps (React, Vite, etc.)
│
└── backend/                         # Express + Prisma API
    ├── server/
    │   ├── index.js                 # Express entry; serves backend/public/ in production
    │   ├── lib/
    │   │   ├── prisma.js            # Prisma client singleton
    │   │   └── socket.js            # Shared Socket.io emit helper
    │   ├── middleware/auth.js        # JWT authentication
    │   └── routes/                  # auth, users, roles, teams, incidents, notifications, admin, profile
    ├── prisma/
    │   ├── schema.prisma            # MySQL schema
    │   ├── seed.js                  # Prisma seed script (node prisma/seed.js)
    │   ├── make-seed-sql.js         # Generates seed.sql with bcrypt hashes for phpMyAdmin import
    │   └── seed.sql                 # Ready-to-import SQL seed (run make-seed-sql.js to regenerate)
    ├── .env                         # Local secrets — never commit
    ├── .env.example                 # Template
    └── package.json                 # Backend-only deps (Express, Prisma, etc.)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+ locally — [XAMPP](https://www.apachefriends.org/) is the easiest option (includes MySQL)

### Local development

```bash
# 1. Clone the repository
git clone <repo-url>
cd scars

# 2. Install backend dependencies
cd backend
npm install

# 3. Create the local environment file
cp .env.example .env
# .env is pre-configured for XAMPP defaults (root / no password)
# Edit DATABASE_URL if your local MySQL has a different user or password

# 4. Create the local database
#    XAMPP → phpMyAdmin → New → name it "scars_db" → Create
#    Or via CLI:
mysql -u root -e "CREATE DATABASE IF NOT EXISTS scars_db;"

# 5. Push schema and seed
npm run db:push
npm run db:seed

# 6. In a second terminal — install and start the frontend
cd ../frontend
npm install
npm run dev

# 7. Back in the first terminal — start the backend
cd ../backend
npm run dev
```

- Frontend → **http://localhost:5173**
- API → **http://localhost:3001/api**
- Health → **http://localhost:3001/api/health**

> **No MySQL?** The app auto-loads mock data when the database is unreachable.
> Read operations work; create/update/delete will fail gracefully.

---

## Environment Variables

**Local:** `backend/.env` (copy from `backend/.env.example`).
**Hostinger:** set in hPanel → Node.js → Environment Variables — no `.env` file needed on the server.

```env
# Local (XAMPP):  mysql://root:@localhost:3306/scars_db
# Hostinger:      mysql://u856082912_scars:PASSWORD@localhost:3306/u856082912_scars_db
DATABASE_URL="mysql://root:@localhost:3306/scars_db"

JWT_SECRET="change-me"      # any string locally; openssl rand -hex 32 for production
PORT=3001
NODE_ENV=development         # use "production" on Hostinger
FRONTEND_URL=http://localhost:5173   # use https://uv-scars.com on Hostinger
FACEPP_API_KEY=
FACEPP_API_SECRET=
```

---

## Database Setup

All database commands run from the `backend/` folder.

```bash
cd backend

npm run db:push      # create / sync all MySQL tables
npm run db:seed      # seed default roles, teams, and accounts
npm run db:studio    # open Prisma Studio (visual DB browser)
npm run db:reset     # drop all data and re-migrate
```

### Default Seed Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@uv.edu.ph | admin123 |
| Officer | officer@uv.edu.ph | off123 |
| Responder | responder@uv.edu.ph | resp123 |
| Student | ana.santos@uv.edu.ph | student123 |

> **Change all passwords before deploying to production.**

---

## Available Scripts

### Frontend (`cd frontend`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on :5173 |
| `npm run build` | Build → `../backend/public/` |
| `npm run preview` | Preview the production build locally |

### Backend (`cd backend`)

| Script | Description |
|---|---|
| `npm run dev` | Start Express with nodemon (auto-restart) |
| `npm start` | Start Express (production) |
| `npm run build:frontend` | Install frontend deps and build into `backend/public/` |
| `npm run deploy` | Full deploy: migrate + seed + build frontend |
| `npm run db:push` | Push Prisma schema → MySQL |
| `npm run db:seed` | Seed default data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Drop and re-migrate |

---

## Project Structure

```
scars/
├── prisma/
│   ├── schema.prisma          # Database schema — User, Role, Team, Incident, Notification, SystemConfig
│   └── seed.js                # Seed script — default roles, teams, and users
├── server/
│   ├── index.js               # Express + Socket.io entry; serves React build in production
│   ├── lib/
│   │   ├── prisma.js          # Prisma client singleton
│   │   └── socket.js          # Shared emit helper (avoids circular imports)
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   └── routes/
│       ├── auth.js            # POST /login, GET /me
│       ├── users.js           # User CRUD
│       ├── roles.js           # Role CRUD
│       ├── teams.js           # Team CRUD
│       ├── incidents.js       # Incident CRUD + validate / verify / assign
│       ├── notifications.js   # Notification CRUD
│       ├── admin.js           # System config (logo, site name) + backup config
│       └── profile.js         # Profile update + Face++ face verification
├── src/
│   ├── components/
│   │   ├── Header.jsx         # Top bar — notification bell, mobile logo badge
│   │   ├── Sidebar.jsx        # Role-based navigation; logo + site name from systemConfig
│   │   ├── Layout.jsx         # App shell with page-enter animation
│   │   ├── LoadingScreen.jsx  # Branded splash screen; reads logo/name from localStorage
│   │   └── BrandingManager.jsx# Invisible — keeps favicon + document.title in sync
│   ├── context/
│   │   └── AppContext.jsx     # Global state, auth, all CRUD actions, Socket.io listeners
│   ├── pages/
│   │   ├── Login.jsx                # Role-based redirect; logo + site name from localStorage
│   │   ├── Dashboard.jsx            # Admin overview — stat cards, quick actions, incident table
│   │   ├── OfficerDashboard.jsx     # Officer panel — validate/verify/assign, team status, alerts
│   │   ├── ResponderDashboard.jsx   # Responder panel — my team, incidents, campus alerts
│   │   ├── StudentDashboard.jsx     # Student portal — report form, my reports, emergency contacts
│   │   ├── Profile.jsx              # Editable profile with photo upload + face verification
│   │   ├── UserManagement.jsx       # User CRUD (admin row protected — no edit/delete)
│   │   ├── IncidentManagement.jsx   # Admin incident table with stats, filters, inline actions
│   │   ├── ResponseManagement.jsx   # Team management and response coordination
│   │   ├── NotificationSystem.jsx   # Compose and send role-targeted alerts
│   │   ├── ReportingAnalytics.jsx   # Charts and CSV export
│   │   └── SystemAdmin.jsx          # Role permissions + general settings (logo, site name)
│   ├── services/
│   │   └── api.js             # Fetch-based API client (auth, users, incidents, profile, admin)
│   └── data/
│       └── mockData.js        # Offline fallback — app works without a running API
├── .env                       # Local secrets (never commit)
├── .env.example               # Template for all environment variables
├── .gitignore
├── vite.config.js             # Vite config + dev proxy for /api and /socket.io
└── package.json
```

---

## API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login — returns `{ token, user }` |
| GET | `/api/auth/me` | Get current user from token |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
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
| PATCH | `/api/incidents/:id/verify` | Mark as verified |
| PATCH | `/api/incidents/:id/assign` | Assign to a response team |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List all notifications |
| POST | `/api/notifications` | Send notification |
| DELETE | `/api/notifications/:id` | Delete notification |

### Teams

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teams` | List all teams with members |
| POST | `/api/teams` | Create team |
| PUT | `/api/teams/:id` | Update team and members |
| DELETE | `/api/teams/:id` | Delete team |

### Roles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/roles` | List roles ordered by level |
| PUT | `/api/roles/:id` | Update role name, description, and permissions |

### Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Get current user's full profile |
| PUT | `/api/profile` | Update name, email, password, or profile photo |
| POST | `/api/profile/verify-face` | Verify an image contains a real human face (Face++ API) |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/system-config` | Get system settings (name, logo, timezone, etc.) |
| PUT | `/api/admin/system-config` | Update system settings including logo image |
| GET | `/api/admin/backup-config` | Get backup settings |
| PUT | `/api/admin/backup-config` | Update backup settings |
| GET | `/api/health` | Health check — returns `{ ok, time }` |

---

## Real-time Events

The server emits Socket.io events after every mutation. The frontend `AppContext` listens and patches state instantly — no polling required.

| Event | Payload | Trigger |
|---|---|---|
| `incident:created` | Incident object | New incident reported |
| `incident:updated` | Incident object | Validate / verify / assign / status change |
| `incident:deleted` | `{ id }` | Incident deleted |
| `user:created` | User object | New user added |
| `user:updated` | User object | User or profile updated |
| `user:deleted` | `{ id }` | User deleted |
| `notification:sent` | Notification object | Alert sent |
| `notification:deleted` | `{ id }` | Notification deleted |
| `team:updated` | Team object | Team created or updated |
| `team:deleted` | `{ id }` | Team deleted |
| `role:updated` | Role object | Role permissions changed |
| `role:deleted` | `{ id }` | Role deleted |

---

## Pages Overview

| Page | Route | Access |
|---|---|---|
| Login | `/` | Public |
| Admin Dashboard | `/dashboard` | Admin |
| Officer Dashboard | `/officer` | Officer |
| Responder Dashboard | `/responder` | Responder |
| Student Dashboard | `/student` | Student |
| My Profile | `/profile` | All roles |
| User Management | `/users` | Admin |
| Incident Management | `/incidents` | Admin, Officer |
| Response Management | `/response` | Admin, Officer, Responder |
| Notification System | `/notifications` | Admin, Responder |
| Reporting & Analytics | `/reports` | Admin, Officer |
| System Administration | `/admin` | Admin |

---

## Deployment — Hostinger Business

**Live URL:** https://uv-scars.com

**How the production stack works:**
- `frontend/` is built into `backend/public/` — Express serves it as static files
- `frontend/static/.htaccess` is copied into the build — handles SPA routing so routes like `/dashboard` never 404 on refresh
- Express (port 3001) serves both the API and the built frontend; Hostinger's Apache reverse-proxies the domain to it

> **Note on SSH:** `npm` is **not** on the SSH PATH on Hostinger shared hosting.
> Use the **"Run NPM command"** field in the hPanel Node.js panel for all npm commands.

---

### MySQL database (already created)

| Field | Value |
|---|---|
| Database | `u856082912_scars_db` |
| User | `u856082912_scars` |
| Host | `localhost` |
| Port | `3306` |

---

### Step 1 — Upload the project

**Option A — Git (recommended)**

Search **SSH Access** in hPanel, connect, then:

```bash
cd ~/domains/uv-scars.com
git clone <repo-url> scars
```

**Option B — File Manager**

Zip the project (exclude `frontend/node_modules/`, `backend/node_modules/`, `backend/public/`), upload via **hPanel → File Manager**, extract into `~/domains/uv-scars.com/scars/`.

---

### Step 2 — Create the Node.js application

1. Search **Node.js** in hPanel (under the **Website** section) and open it
2. Click **Create Application** and fill in:

| Setting | Value |
|---|---|
| Node.js version | `20.x` (LTS) |
| Application mode | `Production` |
| Application root | `~/domains/uv-scars.com/scars/backend` |
| Application URL | `uv-scars.com` |
| Application startup file | `server/index.js` |

3. Add **Environment Variables**:

| Key | Value |
|---|---|
| `DATABASE_URL` | `mysql://u856082912_scars:YOUR_DB_PASSWORD@localhost:3306/u856082912_scars_db` |
| `JWT_SECRET` | any long random string |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://uv-scars.com` |
| `FACEPP_API_KEY` | *(optional)* |
| `FACEPP_API_SECRET` | *(optional)* |

4. Click **Create**

---

### Step 3 — Install, build, and seed

Inside the Node.js app panel, use the **"Run NPM command"** field in this order:

| Enter this | What it does |
|---|---|
| `install` | installs backend packages + runs `prisma generate` |
| `run build:frontend` | installs frontend packages and builds into `backend/public/` |
| `run db:push` | creates all MySQL tables from the Prisma schema |

#### Seed the database (two options — pick one)

**Option A — phpMyAdmin (recommended, no Node.js needed)**

1. Run `node backend/prisma/make-seed-sql.js` **locally** to generate `backend/prisma/seed.sql` with real bcrypt hashes
2. In Hostinger hPanel → **Databases** → **phpMyAdmin**
3. Select `u856082912_scars_db` → click **Import** tab → choose `seed.sql` → click **Go**

**Option B — Node.js panel**

In the "Run NPM command" field: `run db:seed`

---

### Step 4 — Start the app

In the Node.js panel, click **Restart** (or **Start**).

Verify:
- `https://uv-scars.com` → login page loads
- `https://uv-scars.com/api/health` → `{ "ok": true }`
- Refreshing `https://uv-scars.com/dashboard` → no 404 or 503

---

### Updating after code changes

1. Upload changed files via File Manager or `git pull` via SSH
2. **Run NPM command**: `install`
3. If frontend changed — **Run NPM command**: `run build:frontend`
4. If schema changed — **Run NPM command**: `run db:push`
5. Click **Restart**

---

### Default seed accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@uv.edu.ph | admin123 |
| Officer | officer@uv.edu.ph | off123 |
| Responder | responder@uv.edu.ph | resp123 |
| Student | ana.santos@uv.edu.ph | student123 |

> **Change all passwords immediately after first login.**

---

## License

Internal use — University of the Visayas Toledo Campus.
