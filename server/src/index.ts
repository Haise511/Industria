import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { webhookCallback } from 'grammy'
import { bot } from './bot/index.js'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import orderRoutes from './routes/orders.js'
import notificationRoutes from './routes/notifications.js'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? '*',
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
})

app.decorate('authenticate', async function (req: Parameters<typeof app.authenticate>[0], reply: Parameters<typeof app.authenticate>[1]) {
  try {
    await req.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

app.get('/health', async () => ({ ok: true }))

// ─── Telegram bot webhook ─────────────────────────────────────────────────────
// Telegram отправляет апдейты на POST /bot/<secret>
// SECRET_PATH защищает от случайных запросов к эндпоинту
const SECRET_PATH = process.env.BOT_SECRET_PATH ?? 'tg-webhook'

app.post(`/bot/${SECRET_PATH}`, async (req, reply) => {
  const handler = webhookCallback(bot, 'fastify')
  return handler(req, reply)
})

// ─── API routes ───────────────────────────────────────────────────────────────
await app.register(authRoutes)
await app.register(profileRoutes)
await app.register(orderRoutes)
await app.register(notificationRoutes)

// ─── Start ────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })

  // Регистрируем webhook в Telegram после старта сервера
  const serverUrl = process.env.SERVER_URL // e.g. https://industria-production-83f3.up.railway.app
  if (serverUrl && process.env.BOT_TOKEN) {
    const webhookUrl = `${serverUrl}/bot/${SECRET_PATH}`
    await bot.api.setWebhook(webhookUrl)
    app.log.info(`Bot webhook set: ${webhookUrl}`)
  } else {
    app.log.warn('SERVER_URL or BOT_TOKEN not set — bot webhook skipped')
  }
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
