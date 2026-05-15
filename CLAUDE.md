# Industria — Project Context for AI

Этот файл — живой контекст проекта. Обновляй его при каждом значимом изменении.
Аналог `program.md` из autoresearch Андрея Карпати — инструкция для AI-агента.

---

## Что это

**Industria** — Telegram Mini App для музыкальной индустрии Центральной Азии (KG, KZ, UZ, RU).

Маркетплейс, где:
- **Заказчики** публикуют заявки (нужен артист на свадьбу, нужна студия для записи)
- **Артисты / Студии / Композиторы** откликаются на заявки
- Два режима ленты: **Обычный** (современная индустрия) и **Тойский** (свадьбы, мероприятия)

---

## Стек

| Слой | Технология |
|---|---|
| Frontend | React 18 + Vite + TypeScript + HashRouter |
| Backend | Node.js + Fastify + Prisma ORM |
| База данных | PostgreSQL |
| Аутентификация | Telegram initData (HMAC-SHA256) → JWT |
| Хостинг фронта | Vercel (`app/` директория) |
| Хостинг бэка + БД | Railway (`server/` директория) |

---

## Структура репозитория

```
Industria/
├── CLAUDE.md              ← этот файл
├── app/                   ← React фронтенд
│   ├── src/
│   │   ├── api.ts         ← HTTP клиент, JWT, адаптеры данных
│   │   ├── context/
│   │   │   └── AuthContext.tsx  ← user + token, localStorage
│   │   ├── telegram.ts    ← обёртка Telegram WebApp SDK
│   │   ├── components/    ← переиспользуемые компоненты
│   │   │   ├── OrderCard  ← карточка заявки (Order interface)
│   │   │   ├── TopBar     ← шапка с кнопками назад/закрыть
│   │   │   ├── BottomNav  ← нижняя навигация (5 табов)
│   │   │   ├── PrimaryButton
│   │   │   └── Field      ← TextInput + TextArea
│   │   ├── screens/       ← экраны (каждый = отдельный роут)
│   │   └── styles/        ← tokens.css, global.css, fonts.css
│   ├── .env               ← VITE_API_URL (не коммитить)
│   └── vercel.json
└── server/                ← Fastify бэкенд
    ├── src/
    │   ├── index.ts       ← точка входа, регистрация плагинов
    │   ├── lib/
    │   │   ├── db.ts      ← Prisma singleton
    │   │   └── telegram.ts ← валидация initData
    │   └── routes/
    │       ├── auth.ts    ← POST /auth
    │       ├── orders.ts  ← CRUD заявок + отклики
    │       ├── profile.ts ← GET/PUT /profile
    │       └── notifications.ts
    ├── prisma/
    │   └── schema.prisma  ← схема БД
    └── .env.example       ← BOT_TOKEN, JWT_SECRET, DATABASE_URL
```

---

## Схема базы данных

```prisma
User       — telegramId, name, role, city, rating, verified, contract
Order      — authorId, price, description, city, date, contract, mode, status
Response   — orderId, userId, status (waiting|accepted|rejected)
Notification — userId, text, read
```

**Роли:** `artist` | `customer` | `studio` | `composer`
**Режимы заявки:** `normal` | `toi`
**Статусы заявки:** `open` | `closed`

---

## API эндпоинты

Все (кроме `/auth` и `/health`) требуют `Authorization: Bearer <jwt>`.

| Метод | Путь | Описание |
|---|---|---|
| POST | /auth | Валидация initData → JWT + user |
| GET | /profile | Мой профиль |
| PUT | /profile | Обновить профиль |
| GET | /orders | Лента (фильтры: mode, role; сортировка: score) |
| POST | /orders | Создать заявку |
| GET | /orders/my | Мои заявки |
| GET | /orders/:id | Детали заявки |
| POST | /orders/:id/respond | Откликнуться |
| GET | /orders/:id/responses | Отклики на мою заявку |
| PATCH | /responses/:id | Принять / отклонить отклик |
| GET | /notifications | Список уведомлений |
| PATCH | /notifications/read | Пометить все прочитанными |

---

## Фронтенд — ключевые паттерны

**Роутинг:** HashRouter. Табы (`/feed`, `/orders/my`, `/responses`, `/active`, `/profile`) показывают `BottomNav`. Остальные экраны — показывают BackButton Telegram.

**Аутентификация:** При старте `OnbLoading` вызывает `api.auth(tg.initData)`. Получает JWT → сохраняет в localStorage → `AuthContext`. Новый пользователь → онбординг, вернувшийся → `/feed`.

**Данные:** `useEffect` + `useState` в каждом экране. Нет глобального стейт-менеджмента (Redux/Zustand). Данные не кешируются между переходами.

**Стили:** CSS custom properties из `tokens.css`. Никакого Tailwind. Каждый компонент — `.tsx` + `.css` рядом. Классы: `ocard`, `bnav`, `screen`, `pbtn`, `topbar`.

**Haptic:** `haptic('light')` на каждое нажатие кнопки. Из `telegram.ts`.

**Order interface** (фронт) vs **ApiOrder** (бэк): разные форматы. Конвертация через `toOrder()` в `api.ts`. Цена: бэк хранит `number` (23900), фронт показывает `"23 900 сом"`.

---

## Переменные окружения

**Backend (Railway):**
```
DATABASE_URL    — строка подключения PostgreSQL (Railway подставляет сам)
BOT_TOKEN       — токен бота от @BotFather
JWT_SECRET      — секрет для подписи токенов
FRONTEND_URL    — URL Vercel (для CORS)
PORT            — Railway подставляет сам
```

**Frontend (Vercel + .env локально):**
```
VITE_API_URL    — https://industria-production-83f3.up.railway.app
```

---

## Реализованные фичи

- [x] Полный UI по Figma (14+ экранов, дизайн-токены)
- [x] Telegram WebApp SDK: expand, BackButton, haptic, header color
- [x] Аутентификация через Telegram initData (HMAC-SHA256 + TTL 24ч)
- [x] JWT + защищённые роуты на бэке
- [x] Онбординг (язык → роль → данные → профиль) с сохранением в БД
- [x] Лента заявок с фильтром по режиму и роли
- [x] Создание заявок
- [x] Отклики (создание, список, принять/отклонить)
- [x] Уведомления (группировка по дате, автопометка прочитанными)
- [x] Профиль пользователя из БД
- [x] Match Score — ранжирование ленты по релевантности пользователю

---

## В работе / Pending

- [ ] Регистрация Mini App в @BotFather
- [ ] Загрузка аватара (нужен S3 / Cloudflare R2)
- [ ] Детальный экран заявки подключить к API (сейчас мок)
- [ ] Создание заявки подключить к API (форма есть, submit нет)
- [ ] Push-уведомления через Telegram Bot API
- [ ] Оплата через Telegram Stars
- [ ] i18n (UI есть, переводов нет)
- [ ] Верификация пользователей

---

## Правила разработки

1. **TypeScript strict** — никаких `any` без крайней необходимости
2. **Комментарии только для неочевидного** — не объяснять что делает код, только почему
3. **Haptic на каждое нажатие** — `haptic('light')` как минимум
4. **Новый экран = новый роут** — всегда в `App.tsx` + в `TAB_PATHS` если таб
5. **Адаптер данных в api.ts** — фронт не знает о бэк-форматах напрямую
6. **Обновляй этот файл** при каждом значимом изменении архитектуры

---

## Match Score — алгоритм ранжирования

Каждая заявка в ленте получает очки релевантности для конкретного пользователя:

| Условие | Очки |
|---|---|
| Город совпадает с городом пользователя | +30 |
| Договор совпадает с предпочтением пользователя | +20 |
| Рейтинг автора (×10, макс 20) | 0–20 |
| Свежесть (убывает на 1 очко в день, макс 30) | 0–30 |

Реализован в `server/src/routes/orders.ts` как SQL подзапрос.
На фронте — бейдж `«98%»` на карточке если score > 60.
