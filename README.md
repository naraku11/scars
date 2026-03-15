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

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Recharts |
| Backend | Express.js (Node.js, ESM) |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Build | Vite |
| Dev | Nodemon, Concurrently |
| Icons | Lucide React |

---

## Features

- **Role-based dashboards** — each role gets its own tailored UI (Admin, Officer, Responder, Student)
- **Real-time updates** — Socket.io broadcasts all data mutations instantly to every connected client
- **Incident lifecycle** — report → validate → verify → assign team → resolve
- **Multi-channel notifications** — send Web Push / SMS / Email alerts to specific role groups
- **Profile photo verification** — optional Face++ API integration checks that uploaded profile photos contain a real face
- **Reporting & analytics** — bar, pie, and line charts with CSV export
- **Smooth animations** — page transitions, loading splash screen, and UI micro-animations
- **Responsive** — works on desktop and mobile

---

## Role System

Four roles in hierarchical order (lower level = higher authority):

| Role | Level | Dashboard | Incidents | Response | Notifications | Reports | Admin |
|---|---|---|---|---|---|---|---|
| Admin | 1 | `/dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Officer | 2 | `/officer` | ✓ | ✓ | — | ✓ | — |
| Responder | 3 | `/responder` | ✓ | ✓ | ✓ | — | — |
| Student | 4 | `/student` | ✓ (report only) | — | — | — | — |

Notification targeting is role-aware — each user's bell only shows alerts addressed to their role or `All`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd scars

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# 4. Push schema to database
npm run db:push

# 5. Seed initial data
npm run db:seed

# 6. Start development (frontend + backend)
npm run dev:full
```

The app will be available at **http://localhost:5173** and the API at **http://localhost:3001**.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/scars_db"

# JWT signing secret — change this in production
JWT_SECRET="your-secret-key-here"

# Express server port
PORT=3001

# Face++ API for profile photo face detection (optional)
# Sign up at https://www.faceplusplus.com/ — free tier available
# Leave blank to skip face detection (any image will be accepted)
FACEPP_API_KEY=
FACEPP_API_SECRET=
```

---

## Database Setup

The project uses **Prisma** with PostgreSQL.

```bash
# Apply schema changes to the database
npm run db:push

# Create a named migration (recommended for production)
npm run db:migrate

# Seed the database with default roles, teams, and users
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (drops all data and re-migrates)
npm run db:reset
```

### Default Seed Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@uv.edu.ph | admin123 |
| Officer | officer@uv.edu.ph | off123 |
| Responder | responder@uv.edu.ph | resp123 |
| Student | ana.santos@uv.edu.ph | student123 |

> ⚠️ Change all passwords before deploying to production.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run server` | Start Express API server |
| `npm run server:dev` | Start Express with auto-restart (nodemon) |
| `npm run dev:full` | Start both frontend and backend concurrently |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview the production build |
| `npm run db:push` | Sync Prisma schema to database (no migration) |
| `npm run db:migrate` | Create and apply a named migration |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:reset` | Reset database and re-migrate |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## Project Structure

```
scars/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js              # Seed script
├── server/
│   ├── index.js             # Express + Socket.io entry point
│   ├── lib/
│   │   ├── prisma.js        # Prisma client singleton
│   │   └── socket.js        # Socket.io shared emit helper
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   └── routes/
│       ├── auth.js          # Login, /me
│       ├── users.js         # User CRUD
│       ├── roles.js         # Role CRUD
│       ├── teams.js         # Team CRUD
│       ├── incidents.js     # Incident CRUD + validate/verify/assign
│       ├── notifications.js # Notification CRUD
│       ├── admin.js         # System & backup config
│       └── profile.js       # Profile update + face verification
├── src/
│   ├── components/
│   │   ├── Header.jsx       # Top bar with functional notification bell
│   │   ├── Sidebar.jsx      # Role-based navigation
│   │   ├── Layout.jsx       # App shell with page transitions
│   │   └── LoadingScreen.jsx# Branded splash screen
│   ├── context/
│   │   └── AppContext.jsx   # Global state + Socket.io client
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx          # Admin dashboard
│   │   ├── OfficerDashboard.jsx   # Officer control panel
│   │   ├── ResponderDashboard.jsx # Responder panel
│   │   ├── StudentDashboard.jsx   # Student report portal
│   │   ├── Profile.jsx            # Profile with photo + face verify
│   │   ├── UserManagement.jsx
│   │   ├── IncidentManagement.jsx
│   │   ├── ResponseManagement.jsx
│   │   ├── NotificationSystem.jsx
│   │   ├── ReportingAnalytics.jsx
│   │   └── SystemAdmin.jsx
│   ├── services/
│   │   └── api.js           # Fetch-based API client
│   └── data/
│       └── mockData.js      # Offline fallback data
├── .env
├── vite.config.js
└── package.json
```

---

## API Reference

All protected endpoints require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns `{ token, user }` |
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
| PATCH | `/api/incidents/:id/assign` | Assign to team |

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
| PUT | `/api/roles/:id` | Update role permissions |

### Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Get current user profile |
| PUT | `/api/profile` | Update name, email, password, photo |
| POST | `/api/profile/verify-face` | Verify profile image has a real face |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/system-config` | Get system settings |
| PUT | `/api/admin/system-config` | Update system settings |

---

## Real-time Events

The server emits Socket.io events after every mutation. The frontend AppContext listens and patches state immediately.

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

| Page | Route | Roles |
|---|---|---|
| Login | `/` | Public |
| Admin Dashboard | `/dashboard` | Admin |
| Officer Dashboard | `/officer` | Officer |
| Responder Dashboard | `/responder` | Responder |
| Student Dashboard | `/student` | Student |
| My Profile | `/profile` | All |
| User Management | `/users` | Admin |
| Incident Management | `/incidents` | Admin, Officer |
| Response Management | `/response` | Admin, Officer, Responder |
| Notification System | `/notifications` | Admin, Responder |
| Reporting & Analytics | `/reports` | Admin, Officer |
| System Administration | `/admin` | Admin |

---

## License

Internal use — University of the Visayas Toledo Campus.
