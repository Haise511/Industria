import type { FastifyInstance } from 'fastify'
import db from '../lib/db.js'
import type { Role, Prisma } from '@prisma/client'

/** Описание одной ссылки в расширенном профиле. URL валидируется на стороне
 *  приложения (не БД), чтобы клиент видел человеческое сообщение об ошибке. */
interface ProfileLink {
  label: string
  url: string
}

/** Нормализует ссылочные поля при отдаче из БД. Под Postgres Json приходит
 *  массивом, под SQLite — строкой (см. .LOCAL_TEST_REVERT.md). Универсальный
 *  парсер, чтобы фронт всегда получал массив. */
function parseLinks(value: unknown): ProfileLink[] {
  if (Array.isArray(value)) return value as ProfileLink[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/** Раскрывает socials/streamings/cases в массивы перед отдачей наружу. */
function normalizeLinks<T extends { socials?: unknown; streamings?: unknown; cases?: unknown }>(u: T): T {
  return {
    ...u,
    socials: parseLinks(u.socials),
    streamings: parseLinks(u.streamings),
    cases: parseLinks(u.cases),
  }
}

/** Sanity-check: фронт может прислать массив, объект, что угодно. Берём только
 *  валидные {label, url} (оба обязательны, url начинается с http(s):// или t.me).
 *  Лимит 20 пунктов на список — защита от случайного спама. */
function sanitizeLinks(input: unknown): ProfileLink[] {
  if (!Array.isArray(input)) return []
  const out: ProfileLink[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const label = String((raw as { label?: unknown }).label ?? '').trim().slice(0, 64)
    const url = String((raw as { url?: unknown }).url ?? '').trim().slice(0, 256)
    if (!url) continue
    if (!/^(https?:\/\/|t\.me\/)/i.test(url)) continue
    out.push({ label: label || url, url })
    if (out.length >= 20) break
  }
  return out
}

export default async function profileRoutes(app: FastifyInstance) {
  app.get('/profile', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    return reply.send(normalizeLinks({ ...user, telegramId: user.telegramId.toString() }))
  })

  // Публичный профиль другого пользователя. Возвращает безопасный subset:
  // никаких telegramId/language/contract — только то, что показываем в
  // дизайне публичного просмотра (design-refs/Профиль/Профиль.png).
  app.get('/users/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = await db.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        city: true,
        bio: true,
        avatarUrl: true,
        rating: true,
        ratingCount: true,
        verified: true,
        socials: true,
        streamings: true,
        cases: true,
      },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return reply.send(normalizeLinks(user))
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
      socials?: unknown
      streamings?: unknown
      cases?: unknown
    }

    const allowed: (keyof typeof body)[] = ['name', 'role', 'city', 'bio', 'avatarUrl', 'contract', 'language']
    const data: Record<string, unknown> = Object.fromEntries(
      allowed.filter(k => body[k] !== undefined).map(k => [k, body[k]])
    )

    // bio — лимит 280 (как в Field на фронте) + trim.
    if (typeof data.bio === 'string') {
      data.bio = (data.bio as string).trim().slice(0, 280)
    }

    // Расширенные ссылки — санитайз отдельно. undefined → не трогаем поле.
    if (body.socials !== undefined) data.socials = sanitizeLinks(body.socials) as Prisma.JsonArray
    if (body.streamings !== undefined) data.streamings = sanitizeLinks(body.streamings) as Prisma.JsonArray
    if (body.cases !== undefined) data.cases = sanitizeLinks(body.cases) as Prisma.JsonArray

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
    return reply.send(normalizeLinks({ ...user, telegramId: user.telegramId.toString() }))
  })
}
