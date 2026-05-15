import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
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

await app.register(authRoutes)
await app.register(profileRoutes)
await app.register(orderRoutes)
await app.register(notificationRoutes)

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
