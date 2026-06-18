# AIO Dashboard — Контекст проєкту

## Ідея

Внутрішній інструмент для ІТ-компанії, що об'єднує в **одному інтерфейсі**:
- **CodebaseHQ** — управління тікетами (завдання від клієнтів, баги, таски між колегами)
- **Clockify** — трекінг часу по проектах і клієнтах
- **Billing Time** — звітність по відпрацьованих годинах

**Для кого:** тільки для колег компанії (внутрішній інструмент, не публічний).

**Ключові фічі:**
- Тікети зі стрічкою активності (коментарі + зміна статусу + час)
- @mentions колег у коментарях
- Глобальний таймер у шапці сайту
- Тижнева таблиця Billing Time (хто/скільки/на якому проекті)

---

## Що вже зроблено (Фаза 1 — Frontend)

**Стек:** React + Vite + Vanilla CSS (Dark Mode, Glassmorphism)

**Структура:**
```
all-in-one project/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/   → AppLayout, Sidebar, TopBar
│       │   └── ui/       (майбутні переносні компоненти)
│       ├── pages/
│       │   ├── DashboardPage.jsx      → Головна з графіком і статами
│       │   ├── TicketsListPage.jsx    → Таблиця всіх тікетів
│       │   ├── TicketDetailPage.jsx   → Тікет + Activity Feed
│       │   ├── NewTicketPage.jsx      → Форма створення тікета
│       │   ├── ProjectsPage.jsx       → Список проектів з часом
│       │   └── ReportsPage.jsx        → Billing Time таблиця
│       ├── styles/
│       │   ├── index.css             → CSS змінні, glassmorphism, анімації
│       │   └── components.css        → Таблиці, бейджі, activity feed, кнопки
│       └── App.jsx                    → Router (react-router-dom)
└── backend/                           → ✅ Node.js + TypeScript + Sequelize
```

**Готові сторінки:**
| Сторінка | Шлях | Статус |
|---|---|---|
| Dashboard | `/dashboard` | ✅ Реальні дані з `/api/stats`, графік |
| Tickets List | `/tickets` | ✅ Таблиця з бейджами статусів |
| New Ticket | `/tickets/new` | ✅ Форма зі всіма полями |
| Ticket Detail | `/tickets/:id` | ✅ Activity Feed (коментарі + час + статуси) |
| Projects | `/projects` | ✅ Список проектів |
| Reports | `/reports` | ✅ Billing Time таблиця по тижнях |

**Глобальний таймер:** у `TopBar`, стан зберігається на сервері (`active_timers`), прив'язаний до проекту/тікета.

---

## Зроблено (Фаза 2 — Backend) ✅

**Стек:** Node.js + Express 5 + **TypeScript** + **Sequelize** (ORM) → MariaDB у Docker

**Архітектура — шарова** (кожен запит: `route → controller → service → repository → БД`):
```
backend/
├── routes/         → лише маршрути + middleware (auth, multer)
├── controllers/    → req ↔ res, без логіки
├── services/       → бізнес-логіка, транзакції
├── repositories/   → доступ до БД через Sequelize (моделі + sequelize.query для JOIN/агрегатів)
├── models/         → 7 Sequelize-моделей під наявну схему (без auto-sync)
├── config/         → env, sequelize (інстанс підключення)
├── middleware/     → auth (JWT), errorHandler (глобальний)
└── utils/          → AppError, asyncHandler, withTransaction
```

**База даних:** `aio_dashboard` (MariaDB)
- `users` — колеги (роль admin/user, статус, аватар, тема/шрифт, handle)
- `projects` — проекти з клієнтами (`is_active` — м'яке видалення)
- `tickets` — тікети (status/priority/ticket_type/assignee/project)
- `activity` — стрічка активності (comment, status_change, time_log, …)
- `time_entries` — записи часу (білінг)
- `active_timers` — стан активного таймера на сервері
- `notifications` — сповіщення (@mention, призначення)

**Схема/дані:** ініціалізуються з [backend/database/init/01-dump.sql](backend/database/init/01-dump.sql) при першому запуску порожнього Docker-тому.

**Готові можливості:**
- **Тікети:** CRUD + видалення (з каскадом активності/часу); стрічка активності; @mentions → сповіщення + email
- **Таймер v2:** серверний стан, прив'язка до проекту/тікета, тривалість рахується в БД (`TIMESTAMPDIFF` — без багів таймзон), ручний ввід часу, редагування — усе атомарно (транзакції)
- **Billing Time:** агрегація `time_entries` по проектах/днях
- **Видалення проекту:** ховає проект + видаляє його тікети, **зберігаючи білінг**
- **Авторизація:** JWT (register/login/me), захищені роути, ролі admin/user
- **Профіль:** редагування, аватар (upload/delete), статус, зміна пароля, унікальність handle/email

---

## Важливі деталі

- **Запуск усього однією командою:** з кореня проєкту `npm run dev` — піднімає БД у Docker, потім backend + frontend
- **БД:** MariaDB 10.11 у Docker (`docker-compose.yml`), том `db_data`, порт 3306
  - Дані + схема ініціалізуються з `backend/database/init/01-dump.sql` (дамп зі старого XAMPP) при першому запуску порожнього тому
  - Корисні скрипти: `npm run db:up`, `npm run db:down`, `npm run db:reset` (стерти том), `npm run db:logs`
- **Перегляд БД (заміна phpMyAdmin):** Adminer → http://localhost:8080 (сервер `db`, користувач `aio` / `aio_password`, база `aio_dashboard`)
- **Frontend:** http://localhost:5173/  •  **Backend:** http://localhost:3001  (health: `/api/health`)
