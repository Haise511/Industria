# Индустрия — Telegram Mini App

Self-contained проект. Можно переносить целиком (~175 МБ).

## Структура

```
Industria/
├── app/                  ← основное приложение (React + TS + Vite)
│   ├── src/              исходники (screens, components, styles, assets)
│   ├── public/fonts/     Fixel Display (9 woff2 + variable ttf)
│   ├── package.json
│   ├── README.md         инструкция запуска и публикации в Telegram
│   ├── node_modules/     ← можно удалить, восстанавливается через npm install
│   └── dist/             прод-сборка (vite build)
└── build-artifacts/      ← вспомогательные файлы (можно удалить если не нужны для отладки)
    ├── figma_full.json   полный JSON-дамп Figma-файла
    ├── specs.json        агрегированные дизайн-токены
    ├── screens/          PNG @2x всех 40+ экранов из Figma (для визуальной сверки)
    ├── fonts-fixel/      распакованный FixelAll.zip (исходный архив шрифтов)
    ├── qa.mjs            Playwright QA-скрипт (computed styles vs Figma)
    ├── qa-fonts.mjs      проверка загрузки Fixel Display
    ├── qa-final.mjs      финальная QA-проверка
    ├── qa-images.mjs     проверка загрузки изображений
    ├── qa-spot.mjs       точечные проверки
    ├── qa-retry.mjs      проверка после iconsax-react фиксов
    ├── extract_specs.mjs скрипт извлечения токенов из Figma JSON
    └── dig.mjs           утилита просмотра конкретных нод Figma
```

## Запуск

```bash
cd app
npm install        # если node_modules удалён
npm run dev        # → http://localhost:5173/
```

Для проверки на нужном вьюпорте (390×844) откройте DevTools → Toggle device toolbar (Ctrl+Shift+M).

## Прод-сборка

```bash
cd app
npm run build      # выводит в app/dist/
npm run preview    # локальный предпросмотр прод-сборки
```

## Минимизация размера

Чтобы перенести проект ещё легче (~12 МБ):

```bash
rm -rf app/node_modules app/dist app/tsconfig.tsbuildinfo
rm -rf build-artifacts   # если не нужны для отладки
```

После переноса восстановить: `cd app && npm install`.

## Telegram-бот

Подробная инструкция в `app/README.md`. Кратко:
1. @BotFather → `/newbot` → получить token
2. `/newapp` → задать Web App URL (для dev — туннель `cloudflared tunnel --url http://localhost:5173`)
3. Деплой `app/dist/` на Vercel/Netlify/Cloudflare Pages → подменить URL у бота

## ⚠ Безопасность
В сессии разработки использовался Personal Access Token Figma. Рекомендуется **отозвать** его: Figma → Settings → Security → Personal access tokens. В исходниках токен не сохранён.
