import { Bot, InlineKeyboard } from 'grammy'

const token = process.env.BOT_TOKEN!
const appUrl = process.env.FRONTEND_URL!
const botUsername = process.env.BOT_USERNAME! // e.g. IndustriaBot

export const bot = new Bot(token)

// ─── /start ──────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('🎵 Открыть Industria', appUrl)

  await ctx.reply(
    `Добро пожаловать в *Industria* — маркетплейс музыкальной индустрии Кыргызстана.\n\n` +
    `Здесь артисты, студии и заказчики находят друг друга.\n\n` +
    `Нажми кнопку ниже чтобы войти в приложение 👇`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  )
})

// ─── /help ───────────────────────────────────────────────────────────────────

bot.command('help', async (ctx) => {
  await ctx.reply(
    `*Industria Bot* — уведомления и управление подпиской.\n\n` +
    `Команды:\n` +
    `/start — открыть приложение\n` +
    `/help — эта справка\n\n` +
    `Вопросы? Пиши в поддержку через приложение.`,
    { parse_mode: 'Markdown' }
  )
})

// ─── Fallback ─────────────────────────────────────────────────────────────────

bot.on('message', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('Открыть Industria', appUrl)
  await ctx.reply('Управление происходит через приложение 👇', {
    reply_markup: keyboard,
  })
})

export { botUsername }
