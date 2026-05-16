# Industria — Project Context for AI

Этот файл — живой контекст проекта. Обновляй его при каждом значимом изменении.
Аналог `program.md` из autoresearch Андрея Карпати — инструкция для AI-агента.

---

## Что это

**Industria** — Telegram Mini App, маркетплейс для музыкальной индустрии Кыргызстана
с расширением в Узбекистан и Казахстан.

**4 роли:** артист, заказчик, студия, композитор — жёстко привязаны к аккаунту.
**2 режима рынка:** обычный (современная индустрия) и тойский (свадьбы, мероприятия).
**2 языка интерфейса:** русский и кыргызский.
**11 городов Кыргызстана** — расширяемый список через админку.

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
│   │   ├── context/AuthContext.tsx  ← user + token, localStorage
│   │   ├── store/filterStore.ts     ← фильтры ленты (JS-модуль с подпиской)
│   │   ├── telegram.ts    ← обёртка Telegram WebApp SDK
│   │   ├── components/    ← OrderCard, TopBar, BottomNav, PrimaryButton, Field
│   │   ├── screens/       ← каждый экран = отдельный роут
│   │   └── styles/        ← tokens.css, global.css, fonts.css
│   ├── .env               ← VITE_API_URL (не коммитить)
│   └── vercel.json
└── server/
    ├── src/
    │   ├── index.ts       ← Fastify + CORS + JWT + bot webhook
    │   ├── bot/index.ts   ← grammy бот: /start, /help, fallback, bot.catch
    │   ├── lib/
    │   │   ├── db.ts      ← Prisma singleton
    │   │   ├── telegram.ts ← валидация initData
    │   │   └── notify.ts  ← notify(userId, text) — БД + Telegram sendMessage
    │   └── routes/auth.ts, orders.ts, profile.ts, notifications.ts
    ├── prisma/schema.prisma
    └── .env.example
```

---

## Схема БД (текущая)

```prisma
User         — telegramId, name, role, city, rating, verified, contract, language
Order        — authorId, price, description, city, date, contract, mode, status,
               orderNumber, editFrozen, cancelReason, confirmedAt,
               confirmedByAuthor, confirmedByExecutor, acceptedResponseId
Response     — orderId, userId, date, comment, status(waiting|accepted|rejected)
Notification — userId, text, read
```

**Order.status (enum):** `open | awaiting_date | today | awaiting_confirmation | awaiting_rating | completed | cancelled | closed`.
`closed` оставлен для обратной совместимости со старыми записями.

**Предстоит расширить** (см. раздел «Roadmap»):
- `Subscription` — userId, plan, expiresAt, trialUsed
- `User` → добавить `socials`, `streamings`, `cancelRate`

**Уже добавлено** (после первой версии CLAUDE.md):
- `Review` — `orderId, fromUserId, toUserId, stars (1..5), text?, createdAt`. Уникальный индекс `[orderId, fromUserId]` — один отзыв на сторону по заказу.
- `User.ratingCount` — счётчик полученных отзывов. Обновляется агрегатом `avg(stars)` в `POST /orders/:id/review`.
- `Response.withdrawnAt` + `ResponseStatus.withdrawn` — исполнитель может отозвать свой отклик пока он `waiting` (`POST /responses/:id/withdraw`).
- `User.nameChangedAt` — лимит на смену имени: не чаще раза в 30 дней (валидация в `PUT /profile`).

---

## API эндпоинты (реализовано)

Все (кроме `/auth`, `/health`) требуют `Authorization: Bearer <jwt>`.

| Метод | Путь | Описание |
|---|---|---|
| POST | /auth | Telegram initData → JWT + user |
| GET/PUT | /profile | Профиль пользователя |
| GET | /orders | Лента (фильтры + Match Score) |
| POST | /orders | Создать заявку |
| GET | /orders/my | Мои заявки |
| GET | /orders/:id | Детали заявки |
| POST | /orders/:id/respond | Откликнуться |
| GET | /orders/:id/responses | Отклики на мою заявку |
| PATCH | /responses/:id | Принять / отклонить отклик (принятие → awaiting_date/today, остальные отклики авто-отклоняются) |
| POST | /orders/:id/confirm | Двустороннее подтверждение выполнения → awaiting_rating |
| POST | /orders/:id/cancel | Отмена заказа с причиной (любой не-терминальный статус) |
| POST | /orders/:id/complete | Escape-hatch awaiting_rating → completed (обычно завершается автоматически вторым отзывом) |
| POST | /orders/:id/review | Оставить отзыв (1..5 + текст ≤280). Когда обе стороны оставили — автоматический переход в completed |
| GET | /orders/:id/my-review | Мой отзыв по заказу (204 если ещё нет) |
| GET | /users/:id/reviews | Отзывы, полученные пользователем |
| GET | /orders/:id/my-response | Мой отклик на заказ (204 если не откликался) |
| POST | /responses/:id/withdraw | Отозвать собственный отклик (только если status=waiting) |
| GET | /notifications | Список уведомлений |
| PATCH | /notifications/read | Пометить прочитанными |

---

## Фронтенд — ключевые паттерны

**Роутинг:** HashRouter. Табы (`/feed`, `/orders/my`, `/responses`, `/active`, `/profile`) показывают `BottomNav`.

**Аутентификация:** `OnbLoading` вызывает `api.auth(tg.initData)` → JWT в localStorage → `AuthContext`. Новый = онбординг, вернувшийся = `/feed`.

**Данные:** `useEffect` + `useState` в каждом экране. Нет Redux/Zustand. Фильтры — `filterStore.ts` (JS-модуль с подпиской).

**Стили:** CSS custom properties из `tokens.css`. Никакого Tailwind. Классы: `ocard`, `bnav`, `screen`, `pbtn`, `topbar`.

**Адаптер:** бэк хранит цену как `number` (23900), фронт показывает `"23 900 сом"`. Конвертация через `toOrder()` в `api.ts`.

---

## Переменные окружения

**Backend (Railway):**
```
DATABASE_URL       — PostgreSQL (Railway подставляет сам через Add Variable)
BOT_TOKEN          — токен бота от @BotFather
BOT_USERNAME       — @username бота (напр. Prototype_mini_app_bot)
BOT_SECRET_PATH    — путь webhook, напр. tg-webhook
SERVER_URL         — публичный URL сервера (напр. https://industria-production-83f3.up.railway.app)
APP_URL            — URL фронтенда для кнопки бота (https://...) — ОТДЕЛЬНО от FRONTEND_URL
FRONTEND_URL       — для CORS, может быть * или конкретный домен
JWT_SECRET         — секрет подписи токенов
PORT               — Railway подставляет сам
```

**Frontend (Vercel + .env локально):**
```
VITE_API_URL = https://industria-production-83f3.up.railway.app
```

**Важно:** `APP_URL` и `FRONTEND_URL` — разные переменные. `FRONTEND_URL` используется для CORS (может быть `*`), `APP_URL` должен быть валидным `https://` URL — иначе кнопка WebApp в боте упадёт с 500.

---

## Реализовано ✅

- Полный UI по Figma (14+ экранов, дизайн-токены)
- Telegram WebApp SDK: expand, BackButton, haptic, header color
- Аутентификация через Telegram initData (HMAC-SHA256 + TTL 24ч)
- JWT + защищённые роуты
- Онбординг (язык → роль → данные → профиль) → БД
- Лента: режимы, роли-табы, фильтры (город, договор, рейтинг), сортировка
- Match Score — ранжирование по релевантности (город+договор+рейтинг+свежесть)
- Создание заявки → API (флоу: форма → дата → подтверждение → POST /orders)
- Отклик → API (флоу: дата → подтверждение → POST /orders/:id/respond)
- Детали заявки из API
- Принять / отклонить отклик (экран `/orders/:id/responses`)
- При принятии/отклонении — Telegram-уведомление откликнувшемуся
- Мои заявки, отклики, активные заказы, история
- Уведомления (группировка по дате, автопометка прочитанными)
- Профиль из БД
- filterStore: фильтры сохраняются между экранами
- **Telegram-бот** (grammy): /start с кнопкой WebApp, /help, webhook на Railway
- notify(userId, text): пишет в БД + шлёт в Telegram
- Диагностика бота: GET /health/bot, GET /health/bot/setup
- **Жизненный цикл заказа (демо-режим)**: принятие отклика → awaiting_date/today → confirm (двустороннее) → awaiting_rating → complete | cancel; editFrozen при первом отклике; модалка отмены с причинами; экраны Active/History фильтруют по lifecycle. Без cron 72h автозавершения — для прода добавить отдельной задачей.

---

## Полный product spec — что нужно реализовать

### 🔴 Критично (без этого продукт не работает)

| Фича | Статус | Описание |
|---|---|---|
| **Telegram-бот** | ✅ Готово | /start, webhook, уведомления при принятии/отклонении отклика |
| **Подписка** | ⬜ Pending | 30-45 дней бесплатно → триал 14д для новых. Студии/композиторы — бесплатно навсегда. Без подписки: серая лента, нельзя откликаться/создавать |
| **Жизненный цикл заказа** | ✅ Готово (демо, без cron) | Состояния awaiting_date→today→awaiting_confirmation→awaiting_rating→completed/cancelled. Двустороннее подтверждение. Автозавершение 72ч пока не реализовано (TODO в коде). |
| **Кыргызский язык** | ⬜ Pending | Перевод всего интерфейса, переключение в реальном времени |
| **Аватар** | ⬜ Pending | Загрузка фото (через Telegram bot file_id или Cloudflare R2) |

### 🟡 Важно (UX существенно страдает)

| Фича | Статус | Описание |
|---|---|---|
| **Рейтинг и отзывы** | ✅ Готово | Модель `Review`, `POST /orders/:id/review`, `ReviewModal` после awaiting_rating. Когда обе стороны оставили отзыв → автоматический переход в completed. Пилюля «Новый» при <3 отзывов, clamp ≥3.0 при 3–9, среднее при 10+. Хелпер `formatRatingTier` в `app/src/api.ts`. |
| **Отзыв отклика** | ✅ Готово | `ResponseStatus.withdrawn` + `Response.withdrawnAt`. `POST /responses/:id/withdraw` — доступно только владельцу пока `waiting`. На /responses карточки кликабельны; на OrderDetail при `lifecycle=open` и `myResponse.status=waiting` — кнопка «Отозвать» (тёмная пилюля #3d3d42 по Figma node 1:9008). Отозванные не показываются в `GET /responses` и `GET /orders/:id/responses`. |
| **Заморозка заявки** | ✅ Готово | `Order.editFrozen=true` при первом отклике. |
| **1 активная заявка** | ✅ Готово | `POST /orders` отклоняет 409 `active_order_exists`, если у автора уже есть заявка того же `mode` в не-терминальном статусе. По одной активной заявке на `normal` и `toi`. |
| **Имя раз в 30 дней** | ✅ Готово | `User.nameChangedAt` + валидация в `PUT /profile`: при смене имени проверяем, что прошло ≥30 дней, иначе 429 `name_change_throttled`. Апдейт того же имени не триггерит лимит. |
| **Профиль расширенный** | Соцсети, стриминги, плейлисты, кейсы — опционально по роли |
| **Верификация** | Заявка → менеджер 72ч → оплата 50% → галочка. Отзыв при рейтинге < 3.5 / отменах > 20% / 3+ жалоб |

### 🟢 Следующий уровень

| Фича | Описание |
|---|---|
| **Повторный заказ** | Из архива заказчик отправляет напрямую исполнителю с предзаполненными данными, минуя ленту |
| **Чат** | Кнопка «Перейти в чат» → Telegram-диалог по username |
| **Отмена заказа** | Причины + 2 сценария (удалить дату / вернуть в заявку) |
| **Жалоба** | Из меню заказа |
| **Услуги команды** | 4 направления с кнопкой «Связаться с менеджером» |
| **Поддержка** | Форма с 4 категориями → ответ в Telegram |
| **11 городов KG** | Заменить текущий список на полный KG список |
| **19 типов уведомлений** | Расширить текущую систему |
| **Уведомления: каналы** | В приложении / только бот / оба |

### ⚪ Архитектурный задел (не реализовывать сейчас)

- Мультистрана: Узбекистан, Казахстан
- Рекомендательная система
- Геймификация
- Срочный заказ
- Избранное
- Сезонный дашборд
- QR-код профиля
- Календарь занятости
- **Админ-панель** (10 модулей: пользователи, заявки, заказы, отзывы, рассылки, подписки/финансы, верификация, контент, аналитика, настройки)

---

## Match Score — алгоритм ранжирования

Реализован в `server/src/routes/orders.ts`, функция `matchScore()`.

| Условие | Очки |
|---|---|
| Город совпадает | +30 |
| Договор совпадает | +20 |
| Рейтинг автора (×4, макс 20) | 0–20 |
| Свежесть (убывает 1/день, макс 30) | 0–30 |

Бейдж на карточке если score ≥ 60.

**Планируется расширить:** верифицированные +15, повторный исполнитель +25.

---

## Правила разработки

1. **TypeScript strict** — `any` только с комментарием почему
2. **Комментарии** — только для неочевидного (почему, не что)
3. **Haptic** — `haptic('light')` на каждое нажатие
4. **Новый экран** — роут в `App.tsx`, если таб — в `TAB_PATHS`
5. **Адаптер** — фронт не знает о бэк-форматах напрямую, всё через `api.ts`
6. **БД-миграции** — при изменении схемы использовать `prisma db push` (dev) или `prisma migrate dev` → `migrate deploy` (prod)
7. **Обновляй этот файл** при каждом значимом изменении
