# AIO Dashboard

[![CI](https://github.com/KREIK2017/all-in-one-project/actions/workflows/ci.yml/badge.svg)](https://github.com/KREIK2017/all-in-one-project/actions/workflows/ci.yml)

Internal tool for IT companies that combines ticket management, time tracking, and billing reporting in a single interface.

## What it does

- **Tickets** — task management with activity feed, comments, @mentions, status changes
- **Timer** — global timer in the header, server-side state, linked to project/ticket
- **Billing Time** — weekly report table showing who worked how long on which project
- **Projects** — project list with time tracking per client
- **Dashboard** — real-time stats and charts from `/api/stats`

## Tech Stack

**Frontend**
- React + Vite
- Vanilla CSS (Dark Mode, Glassmorphism)
- React Router

**Backend**
- Node.js + Express 5 + TypeScript
- Sequelize ORM — MariaDB
- JWT authentication
- Layered architecture: `route → controller → service → repository → DB`

**Infrastructure**
- MariaDB 10.11 in Docker
- Adminer for DB management

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

MariaDB runs in Docker. Schema and seed data are initialized from `backend/database/init/01-dump.sql` on first run.

```bash
npm run db:up      # start DB
npm run db:down    # stop DB
npm run db:reset   # wipe volume and restart
npm run db:logs    # view DB logs
```

**Tables:** `users`, `projects`, `tickets`, `activity`, `time_entries`, `active_timers`, `notifications`

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
    ├── models/
    ├── config/
    ├── middleware/
    └── utils/
```

## Features

- Full ticket CRUD with cascading delete (activity + time entries preserved)
- Activity feed: comments, status changes, time logs
- @mentions → notifications + email
- Server-side timer with `TIMESTAMPDIFF` (timezone-safe), atomic transactions
- Billing Time aggregation by project/day
- JWT auth with roles (admin/user)
- User profile: avatar upload/delete, handle, status, password change
