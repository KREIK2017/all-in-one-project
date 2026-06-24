# AIO Dashboard

[![CI](https://github.com/KREIK2017/all-in-one-project/actions/workflows/ci.yml/badge.svg)](https://github.com/KREIK2017/all-in-one-project/actions/workflows/ci.yml)

Internal tool for IT companies that combines ticket management, time tracking, and billing reporting in a single interface.

## What it does

- **Tickets** — task management with activity feed, comments, @mentions, status changes
- **Timer** — global timer in the header, server-side state, linked to project/ticket
- **Billing Time** — weekly report table showing who worked how long on which project
- **Projects** — project list with time tracking per client
- **Dashboard** — real-time stats and charts from `/api/stats`
- **Presence** — live online/away/offline status for colleagues via Socket.IO
- **Work bot** — an admin-controlled bot that simulates work on a ticket (time logs, comments, status changes)

## Tech Stack

**Frontend**
- React + Vite
- Vanilla CSS (Dark Mode, Glassmorphism)
- React Router

**Backend**
- Node.js + Express 5 + TypeScript
- Sequelize ORM (umzug migrations) — MariaDB
- Socket.IO — real-time presence
- JWT auth, helmet, login rate limiting
- Layered architecture: `route → controller → service → repository → DB`

**Infrastructure**
- MariaDB 10.11 in Docker
- Adminer for DB management
- GitHub Actions CI (typecheck + Vitest tests + frontend lint/build)

## Getting Started

**Prerequisites:** Node.js, Docker

```bash
# Clone the repo
git clone https://github.com/KREIK2017/all-in-one-project.git
cd all-in-one-project

# Install dependencies (root, backend, frontend)
npm install
npm install --prefix backend
npm install --prefix frontend

# Start everything (DB in Docker + backend + frontend)
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Adminer (DB UI): http://localhost:8080 — server: `db`, user: `aio`, password: `aio_password`, database: `aio_dashboard`

> Note: copy `backend/.env.example` to `backend/.env` and fill in your own secrets (JWT secret, SMTP credentials) before running.

## Database

MariaDB runs in Docker. The schema is defined as **Sequelize (umzug) migrations** and applied automatically when the backend starts. On an empty database it is also seeded with demo data.

**Demo login (fresh DB):** `admin@demo.com` / `demo1234`

```bash
# DB container (run from repo root)
npm run db:up      # start DB
npm run db:down    # stop DB
npm run db:reset   # wipe volume and restart (schema is rebuilt by migrations on next start)
npm run db:logs    # view DB logs

# Migrations & seed (run from backend/)
npm run db:migrate          # apply pending migrations
npm run db:migrate:undo     # roll back the last migration
npm run db:migrate:status   # list pending migrations
npm run db:seed             # insert demo data (only if DB is empty)
```

**Tables:** `users`, `projects`, `tickets`, `ticket_assignees`, `activity`, `time_entries`, `active_timers`, `notifications`

## Project Structure

```
all-in-one-project/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/       → AppLayout, Sidebar, TopBar
│       │   └── ui/
│       ├── pages/
│       │   ├── DashboardPage.jsx
│       │   ├── TicketsListPage.jsx
│       │   ├── TicketDetailPage.jsx
│       │   ├── NewTicketPage.jsx
│       │   ├── ProjectsPage.jsx
│       │   └── ReportsPage.jsx
│       └── App.jsx
└── backend/
    ├── routes/
    ├── controllers/
    ├── services/
    ├── repositories/
    ├── models/         → Sequelize models
    ├── migrations/     → umzug schema migrations
    ├── db/             → sequelize instance, migrator, seed
    ├── config/
    ├── middleware/
    ├── utils/
    ├── tests/          → Vitest unit tests
    ├── socket.ts       → Socket.IO (real-time presence)
    └── bot.ts          → work-simulating bot
```

## Features

- Full ticket CRUD with cascading delete (activity + time entries preserved)
- **Multiple assignees per ticket** (many-to-many) with avatar pickers
- **Private tickets** — visible only to the creator and assignees
- Activity feed: comments, status changes, time logs, assignee changes
- @mentions → notifications + email
- **Real-time presence** (online / away / offline) via Socket.IO
- **Work-simulating bot** — admin-controlled, runs on a specific ticket
- Server-side timer with `TIMESTAMPDIFF` (timezone-safe), atomic transactions
- Billing Time aggregation by project/day
- JWT auth with roles (admin/user), `helmet` + login rate limiting
- User profile: avatar upload/delete, handle, status, password change
- Accessible custom dropdowns (keyboard navigation + ARIA)

## Testing

```bash
cd backend
npm test            # Vitest unit tests (services, mocked repositories)
npm run typecheck   # tsc --noEmit
```

CI runs these (plus frontend lint + build) on every push — see the badge above.
