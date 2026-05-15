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

await app.register(cors, { origin: process.env.FRONTEND_URL ?? '*' })
await app.register(jwt, { secret: process.env.JWT_SECRET! })

app.decorate('authenticate', async function (
  req: Parameters<typeof app.authenticate>[0],
  reply: Parameters<typeof app.authenticate>[1]
) {
  try {
    await req.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', async () => ({ ok: true }))

// Диагностика: статус вебхука и переменных окружения
app.get('/health/bot', async () => {
  const token = process.env.BOT_TOKEN
  const serverUrl = process.env.SERVER_URL
  const secretPath = process.env.BOT_SECRET_PATH ?? 'tg-webhook'

  if (!token) return { ok: false, error: 'BOT_TOKEN not set' }

  try {
    const info = await bot.api.getWebhookInfo()
    return {
      ok: true,
      webhook: info,
      expectedUrl: serverUrl ? `${serverUrl}/bot/${secretPath}` : 'SERVER_URL not set',
      envCheck: {
        BOT_TOKEN: !!token,
        SERVER_URL: !!serverUrl,
        BOT_SECRET_PATH: secretPath,
        FRONTEND_URL: process.env.FRONTEND_URL ?? 'not set',
      },
    }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

// Ручная регистрация вебхука (если авторегистрация не сработала)
app.get('/health/bot/setup', async (req, reply) => {
  const token = process.env.BOT_TOKEN
  const serverUrl = process.env.SERVER_URL
  const secretPath = process.env.BOT_SECRET_PATH ?? 'tg-webhook'

  if (!token || !serverUrl) {
    return reply.status(400).send({ error: 'BOT_TOKEN or SERVER_URL not set' })
  }

  const webhookUrl = `${serverUrl}/bot/${secretPath}`
  await bot.api.setWebhook(webhookUrl)
  return { ok: true, webhookUrl }
})

// ─── Bot webhook ──────────────────────────────────────────────────────────────

const SECRET_PATH = process.env.BOT_SECRET_PATH ?? 'tg-webhook'
const handleUpdate = webhookCallback(bot, 'fastify')

app.post(`/bot/${SECRET_PATH}`, handleUpdate)

// ─── API routes ───────────────────────────────────────────────────────────────

await app.register(authRoutes)
await app.register(profileRoutes)
await app.register(orderRoutes)
await app.register(notificationRoutes)

// ─── Start ────────────────────────────────────────────────────────────────────

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

await app.listen({ port, host })

const serverUrl = process.env.SERVER_URL
if (serverUrl && process.env.BOT_TOKEN) {
  const webhookUrl = `${serverUrl}/bot/${SECRET_PATH}`
  try {
    await bot.api.setWebhook(webhookUrl)
    app.log.info(`✅ Bot webhook set: ${webhookUrl}`)
  } catch (e) {
    app.log.error(`❌ Failed to set webhook: ${e}`)
  }
} else {
  app.log.warn(`⚠️  Bot webhook skipped — SERVER_URL=${process.env.SERVER_URL} BOT_TOKEN=${!!process.env.BOT_TOKEN}`)
}
