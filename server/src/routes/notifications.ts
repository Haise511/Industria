import type { FastifyInstance } from 'fastify'
import db from '../lib/db.js'

export default async function notificationRoutes(app: FastifyInstance) {
  app.get('/notifications', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return reply.send(notifications)
  })

  app.patch('/notifications/read', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }

    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })

    return reply.send({ ok: true })
  })
}
