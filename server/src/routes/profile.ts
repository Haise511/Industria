import type { FastifyInstance } from 'fastify'
import db from '../lib/db.js'
import type { Role } from '@prisma/client'

export default async function profileRoutes(app: FastifyInstance) {
  app.get('/profile', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    return reply.send({ ...user, telegramId: user.telegramId.toString() })
  })

  app.put('/profile', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const body = req.body as {
      name?: string
      role?: Role
      city?: string
      bio?: string
      avatarUrl?: string
      contract?: boolean
      language?: string
    }

    const allowed: (keyof typeof body)[] = ['name', 'role', 'city', 'bio', 'avatarUrl', 'contract', 'language']
    const data = Object.fromEntries(
      allowed.filter(k => body[k] !== undefined).map(k => [k, body[k]])
    )

    const user = await db.user.update({ where: { id: userId }, data })
    return reply.send({ ...user, telegramId: user.telegramId.toString() })
  })
}
