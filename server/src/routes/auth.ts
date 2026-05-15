import type { FastifyInstance } from 'fastify'
import { validateInitData } from '../lib/telegram.js'
import db from '../lib/db.js'

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth', async (req, reply) => {
    const { initData } = req.body as { initData: string }

    if (!initData) {
      return reply.status(400).send({ error: 'initData required' })
    }

    const botToken = process.env.BOT_TOKEN!
    let tgUser
    try {
      tgUser = validateInitData(initData, botToken)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Validation failed'
      return reply.status(401).send({ error: message })
    }

    let user = await db.user.findUnique({
      where: { telegramId: BigInt(tgUser.id) },
    })

    const isNew = !user

    if (!user) {
      user = await db.user.create({
        data: {
          telegramId: BigInt(tgUser.id),
          name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
          username: tgUser.username,
          role: 'customer',
        },
      })
    }

    const token = app.jwt.sign({ userId: user.id })

    return reply.send({
      token,
      user: serializeUser(user),
      isNew,
    })
  })
}

function serializeUser(user: {
  id: number
  telegramId: bigint
  name: string
  username: string | null
  role: string
  city: string | null
  bio: string | null
  avatarUrl: string | null
  rating: number
  verified: boolean
  contract: boolean
  language: string
}) {
  return {
    ...user,
    telegramId: user.telegramId.toString(),
  }
}
