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
└── backend/                           → (в процесі, Node.js)
```

**Готові сторінки:**
| Сторінка | Шлях | Статус |
|---|---|---|
| Dashboard | `/dashboard` | ✅ Мокові дані, графік |
| Tickets List | `/tickets` | ✅ Таблиця з бейджами статусів |
| New Ticket | `/tickets/new` | ✅ Форма зі всіма полями |
| Ticket Detail | `/tickets/:id` | ✅ Activity Feed (коментарі + час + статуси) |
| Projects | `/projects` | ✅ Список проектів |
| Reports | `/reports` | ✅ Billing Time таблиця по тижнях |

**Глобальний таймер:** є в `TopBar`, але поки без збереження і прив'язки до проекту.

---

## Що потрібно зробити (Фаза 2 — Backend)

**Стек:** Node.js (Express) + MySQL (через XAMPP / phpMyAdmin)

**База даних:** `aio_dashboard`
- `users` — колеги компанії
- `projects` — проекти з клієнтами
- `tickets` — тікети з полями status/priority/assignee
- `activity` — стрічка активності (коментарі, зміни статусів, логи часу)
- `time_entries` — записи часу (старт, кінець, хвилини, проект, тікет)
- `active_timers` — поточний стан таймера на сервері

**SQL-схема:** вже готова у файлі [backend/database/schema.sql](file:///d:/%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D0%B9%20%D1%81%D1%82%D0%BE%D0%BB/projeckts/Antigravity/all-in-one%20project/backend/database/schema.sql)

**Пріоритет 1 — Таймер v2.0:**
- Прив'язати до проекту (dropdown в TopBar)
- Зберігати стан на сервері (не скидається при закритті браузера)
- При Stop → зберігати в `time_entries`
- Ручне редагування часу (з логуванням хто/коли змінив)
- Дані відображаються в Billing Time в реальному часі

**Пріоритет 2 — Тікети + API:**
- REST API для CRUD операцій з тікетами
- Підключити форму [NewTicketPage](file:///d:/%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D0%B9%20%D1%81%D1%82%D0%BE%D0%BB/projeckts/Antigravity/all-in-one%20project/frontend/src/pages/NewTicketPage.jsx#4-84) до реального API
- Зберігати коментарі та зміни статусів в `activity`

**Пріоритет 3 — Авторизація:**
- JWT токени (login/logout)
- Захищені API роути

---

## Важливі деталі

- **Запуск усього однією командою:** з кореня проєкту `npm run dev` — піднімає БД у Docker, потім backend + frontend
- **БД:** MariaDB 10.11 у Docker (`docker-compose.yml`), том `db_data`, порт 3306
  - Дані + схема ініціалізуються з `backend/database/init/01-dump.sql` (дамп зі старого XAMPP) при першому запуску порожнього тому
  - Корисні скрипти: `npm run db:up`, `npm run db:down`, `npm run db:reset` (стерти том), `npm run db:logs`
- **Перегляд БД (заміна phpMyAdmin):** Adminer → http://localhost:8080 (сервер `db`, користувач `aio` / `aio_password`, база `aio_dashboard`)
- **Frontend:** http://localhost:5173/  •  **Backend:** http://localhost:3001  (health: `/api/health`)
