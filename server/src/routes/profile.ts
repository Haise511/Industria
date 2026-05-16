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
    const data: Record<string, unknown> = Object.fromEntries(
      allowed.filter(k => body[k] !== undefined).map(k => [k, body[k]])
    )

    // Лимит на смену имени: не чаще раза в 30 дней. Применяется только
    // когда новое имя реально отличается от текущего, чтобы PUT с
    // полем name=<то же самое> не давал ложный 429.
    if (typeof data.name === 'string') {
      const current = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, nameChangedAt: true },
      })
      if (current && data.name !== current.name) {
        const last = current.nameChangedAt?.getTime() ?? 0
        const elapsedDays = (Date.now() - last) / 86_400_000
        if (last && elapsedDays < 30) {
          const daysLeft = Math.ceil(30 - elapsedDays)
          return reply.status(429).send({
            error: 'name_change_throttled',
            message: `Имя можно менять не чаще раза в 30 дней. Попробуйте через ${daysLeft} дн.`,
            daysLeft,
          })
        }
        // Фиксируем момент смены — следующий апдейт уже триггерит лимит.
        data.nameChangedAt = new Date()
      } else {
        // Имя не меняется — не пишем поле, чтобы не дёргать Prisma зря.
        delete data.name
      }
    }

    const user = await db.user.update({ where: { id: userId }, data })
    return reply.send({ ...user, telegramId: user.telegramId.toString() })
  })
}
