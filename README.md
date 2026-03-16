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

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd scars

# 2. Install dependencies (also runs prisma generate via postinstall)
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, and optionally FACEPP keys

# 4. Push schema to database and seed
npm run db:push
npm run db:seed

# 5. Start development (frontend + backend)
npm run dev:full
```

The frontend runs at **http://localhost:5173** and the API at **http://localhost:3001**.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# MySQL connection string
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/scars_db"

# JWT signing secret — use a long random string in production
# Generate one: openssl rand -hex 32
JWT_SECRET="your-secret-key-here"

# Express server port (Hostinger sets this automatically)
PORT=3001

# Set to "production" when deploying
NODE_ENV=production

# Face++ API for profile photo face detection (optional)
# Sign up at https://www.faceplusplus.com/ — free tier available
# Leave blank to skip face detection (any image will be accepted)
FACEPP_API_KEY=
FACEPP_API_SECRET=
```

---

## Database Setup

The project uses **Prisma ORM** with **MySQL 8+**.

```bash
# Apply schema to database (no migration file created)
npm run db:push

# Create and apply a named migration (recommended for production)
npm run db:migrate

# Seed the database with default roles, teams, and users
npm run db:seed

# Open Prisma Studio (visual database GUI)
npm run db:studio

# Reset database — drops all data and re-migrates
npm run db:reset
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

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run server` | Start Express API server |
| `npm run server:dev` | Start Express with auto-restart (nodemon) |
| `npm run dev:full` | Start both frontend and backend concurrently |
| `npm run build` | Build React frontend → `dist/` |
| `npm run build:prod` | Build frontend + regenerate Prisma client |
| `npm start` | Start production server (serves API + built frontend) |
| `npm run preview` | Preview production build locally |
| `npm run db:push` | Sync Prisma schema → database (no migration file) |
| `npm run db:migrate` | Create and apply a named migration |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:reset` | Drop all data and re-migrate |
| `npm run db:studio` | Open Prisma Studio GUI |

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
- Vite builds the React app into `public/` — Hostinger's Node.js manager reads output from there
- `static/.htaccess` is auto-copied into `public/` at build time — handles SPA routing so `/dashboard`, `/officer`, etc. never 404 on direct access or refresh
- Express (port 3001) serves all API routes and Socket.io; Hostinger's Apache reverse-proxies the domain to it

> **Note on SSH:** `npm` is **not** on the SSH PATH on Hostinger shared hosting. Use the **"Run NPM command"** field inside the hPanel Node.js panel for all `npm`/`npx` commands.

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

Zip the project locally (exclude `node_modules/` and `public/`), upload via **hPanel → File Manager**, extract into `~/domains/uv-scars.com/scars/`.

---

### Step 2 — Create the Node.js application

1. Search **Node.js** in hPanel (under the **Website** section) and open it
2. Click **Create Application** and fill in:

| Setting | Value |
|---|---|
| Node.js version | `20.x` (LTS) |
| Application mode | `Production` |
| Application root | `~/domains/uv-scars.com/scars` |
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
| `install` | installs packages + runs `prisma generate` automatically |
| `run deploy` | pushes DB schema, seeds accounts, and builds the frontend |

> `npm run deploy` = `prisma generate && prisma db push && node prisma/seed.js && vite build`
>
> If you want to run steps separately:
> ```
> run db:push     ← creates all MySQL tables
> run db:seed     ← seeds roles, teams, default accounts
> run build       ← builds React frontend → public/
> ```

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
2. In the hPanel Node.js panel — **Run NPM command**: `install`
3. **Run NPM command**: `run build`
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
