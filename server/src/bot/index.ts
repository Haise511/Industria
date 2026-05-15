import { Bot, InlineKeyboard } from 'grammy'

const token = process.env.BOT_TOKEN!

// APP_URL — публичный URL фронтенда (Vercel).
// Отдельная переменная от FRONTEND_URL, которая используется для CORS.
const appUrl = process.env.APP_URL ?? ''

export const bot = new Bot(token)

function openAppKeyboard() {
  if (!appUrl.startsWith('https://')) return undefined
  return new InlineKeyboard().webApp('🎵 Открыть Industria', appUrl)
}

// ─── /start ──────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const keyboard = openAppKeyboard()
  await ctx.reply(
    `Добро пожаловать в *Industria* — маркетплейс музыкальной индустрии Кыргызстана.\n\n` +
    `Здесь артисты, студии и заказчики находят друг друга.\n\n` +
    (keyboard ? `Нажми кнопку ниже чтобы войти в приложение 👇` : `Открой приложение через Telegram.`),
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
})

// ─── /help ───────────────────────────────────────────────────────────────────

bot.command('help', async (ctx) => {
  await ctx.reply(
    `*Industria Bot* — уведомления и управление подпиской.\n\n` +
    `/start — открыть приложение\n` +
    `/help — эта справка\n\n` +
    `Вопросы? Пиши в поддержку через приложение.`,
    { parse_mode: 'Markdown' }
  )
})

// ─── Fallback ─────────────────────────────────────────────────────────────────

bot.on('message', async (ctx) => {
  const keyboard = openAppKeyboard()
  await ctx.reply('Управление происходит через приложение 👇', { reply_markup: keyboard })
})

// Глобальный обработчик — ловит все необработанные ошибки бота,
// чтобы webhook не возвращал 500 при любой внутренней ошибке.
bot.catch((err) => {
  console.error('Bot error:', err.message)
})
