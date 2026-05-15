import type { FastifyInstance } from 'fastify'
import db from '../lib/db.js'
import { notify, messages } from '../lib/notify.js'
import type { ContractType, OrderMode, ResponseStatus } from '@prisma/client'

// Демо-режим жизненного цикла заказа.
// TODO (post-demo): cron-задача автозавершения через 72ч в awaiting_confirmation,
// автоматический переход awaiting_date → today по наступлению даты (сейчас вычисляется на лету при принятии).

const NON_TERMINAL_STATUSES = [
  'open',
  'awaiting_date',
  'today',
  'awaiting_confirmation',
  'awaiting_rating',
] as const

// Проверяет, что дата заказа (формат YYYY-MM-DD или произвольная строка) — сегодня.
function isToday(date: string | null | undefined): boolean {
  if (!date) return false
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayIso = `${yyyy}-${mm}-${dd}`
  return date.startsWith(todayIso)
}

export default async function orderRoutes(app: FastifyInstance) {
  // Лента заявок с Match Score
  app.get('/orders', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const query = req.query as {
      mode?: OrderMode
      role?: string
      city?: string
      contract?: string
      limit?: string
      offset?: string
    }

    const where: Record<string, unknown> = { status: 'open' }
    if (query.mode) where.mode = query.mode
    if (query.city) where.city = query.city
    if (query.contract) where.contract = query.contract as ContractType
    if (query.role) where.author = { role: query.role }

    const [orders, viewer] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, role: true, rating: true, avatarUrl: true, verified: true },
          },
        },
        take: Number(query.limit ?? 50),
        skip: Number(query.offset ?? 0),
      }),
      db.user.findUnique({ where: { id: userId }, select: { city: true, contract: true } }),
    ])

    const scored = orders
      .map(o => ({ ...o, score: matchScore(o, viewer) }))
      .sort((a, b) => b.score - a.score)

    return reply.send(scored)
  })

  // Детали заявки
  app.get('/orders/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const order = await db.order.findUnique({
      where: { id: Number(id) },
      include: {
        author: {
          select: { id: true, name: true, role: true, rating: true, avatarUrl: true, verified: true },
        },
        _count: { select: { responses: true } },
      },
    })

    if (!order) return reply.status(404).send({ error: 'Not found' })
    return reply.send(order)
  })

  // Создать заявку
  app.post('/orders', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const body = req.body as {
      price: number
      description: string
      city?: string
      date?: string
      contract?: ContractType
      mode?: OrderMode
    }

    if (!body.price || !body.description) {
      return reply.status(400).send({ error: 'price and description required' })
    }

    const order = await db.order.create({
      data: {
        authorId: userId,
        price: body.price,
        description: body.description,
        city: body.city,
        date: body.date,
        contract: body.contract ?? 'cash',
        mode: body.mode ?? 'normal',
      },
    })

    return reply.status(201).send(order)
  })

  // Мои заявки
  app.get('/orders/my', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }

    const orders = await db.order.findMany({
      where: { authorId: userId },
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send(orders)
  })

  // Откликнуться на заявку
  app.post('/orders/:id/respond', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }
    const body = req.body as { date?: string; comment?: string }

    const order = await db.order.findUnique({ where: { id: Number(id) } })
    if (!order) return reply.status(404).send({ error: 'Order not found' })
    if (order.status !== 'open') return reply.status(409).send({ error: 'Order is closed' })
    if (order.authorId === userId) return reply.status(400).send({ error: 'Cannot respond to own order' })

    const response = await db.response.upsert({
      where: { orderId_userId: { orderId: Number(id), userId } },
      create: { orderId: Number(id), userId, date: body.date, comment: body.comment },
      update: { date: body.date, comment: body.comment, status: 'waiting' },
    })

    // При первом отклике замораживаем редактирование заявки.
    if (!order.editFrozen) {
      await db.order.update({ where: { id: order.id }, data: { editFrozen: true } })
    }

    return reply.status(201).send(response)
  })

  // Мои отклики
  app.get('/responses', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }

    const responses = await db.response.findMany({
      where: { userId },
      include: {
        order: {
          include: {
            author: {
              select: { id: true, name: true, role: true, rating: true, avatarUrl: true, verified: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send(responses)
  })

  // Отклики на мои заявки (для автора)
  app.get('/orders/:id/responses', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }

    const order = await db.order.findUnique({ where: { id: Number(id) } })
    if (!order) return reply.status(404).send({ error: 'Not found' })
    if (order.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const responses = await db.response.findMany({
      where: { orderId: Number(id) },
      include: {
        user: {
          select: { id: true, name: true, role: true, rating: true, avatarUrl: true, verified: true },
        },
      },
    })

    return reply.send(responses)
  })

  // Принять / отклонить отклик
  app.patch('/responses/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: ResponseStatus }

    if (!['accepted', 'rejected'].includes(status)) {
      return reply.status(400).send({ error: 'status must be accepted or rejected' })
    }

    const response = await db.response.findUnique({
      where: { id: Number(id) },
      include: { order: true },
    })

    if (!response) return reply.status(404).send({ error: 'Not found' })
    if (response.order.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await db.response.update({
      where: { id: Number(id) },
      data: { status },
    })

    const desc = response.order.description

    if (status === 'accepted') {
      // Закрываем остальные отклики и переводим заказ в нужный статус жизненного цикла.
      const nextStatus = isToday(response.date ?? response.order.date) ? 'today' : 'awaiting_date'

      await db.$transaction([
        db.response.updateMany({
          where: { orderId: response.orderId, id: { not: response.id }, status: 'waiting' },
          data: { status: 'rejected' },
        }),
        db.order.update({
          where: { id: response.orderId },
          // Каст до any: новый enum OrderStatus ещё не сгенерирован Prisma Client локально,
          // на Railway после prisma generate типы подхватятся.
          data: {
            status: nextStatus,
            acceptedResponseId: response.id,
            date: response.date ?? response.order.date,
          } as never,
        }),
      ])

      notify(response.userId, messages.responseAccepted(desc)).catch(() => {})
      if (nextStatus === 'today') {
        notify(response.userId, messages.orderDateToday(desc)).catch(() => {})
        notify(response.order.authorId, messages.orderDateToday(desc)).catch(() => {})
      }
    } else {
      notify(response.userId, messages.responseRejected(desc)).catch(() => {})
    }

    return reply.send(updated)
  })

  // ─── Жизненный цикл заказа ─────────────────────────────────────────────────

  // Подтвердить выполнение (двустороннее). Доступно автору и исполнителю.
  app.post('/orders/:id/confirm', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }

    const order = await db.order.findUnique({
      where: { id: Number(id) },
      include: { responses: { where: { status: 'accepted' }, take: 1 } },
    })
    if (!order) return reply.status(404).send({ error: 'Not found' })

    const executor = order.responses[0]
    const isAuthor = order.authorId === userId
    const isExecutor = executor?.userId === userId
    if (!isAuthor && !isExecutor) return reply.status(403).send({ error: 'Forbidden' })

    // Подтверждение допустимо только в статусах today / awaiting_confirmation.
    if (order.status !== 'today' && order.status !== 'awaiting_confirmation') {
      return reply.status(409).send({ error: 'Order is not ready for confirmation' })
    }

    const patch: Record<string, unknown> = {}
    if (isAuthor) patch.confirmedByAuthor = true
    if (isExecutor) patch.confirmedByExecutor = true

    const bothConfirmed =
      (isAuthor || order.confirmedByAuthor) && (isExecutor || order.confirmedByExecutor)

    if (bothConfirmed) {
      patch.status = 'awaiting_rating'
      patch.confirmedAt = new Date()
    } else {
      patch.status = 'awaiting_confirmation'
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: patch as never,
    })

    // Уведомление другой стороне.
    const otherUserId = isAuthor ? executor?.userId : order.authorId
    if (otherUserId) {
      if (bothConfirmed) {
        notify(otherUserId, messages.orderCompleted(order.description)).catch(() => {})
        // И тому, кто только что нажал — тоже.
        notify(userId, messages.orderCompleted(order.description)).catch(() => {})
      } else {
        notify(otherUserId, messages.orderConfirmedByOther(order.description)).catch(() => {})
      }
    }

    return reply.send(updated)
  })

  // Отмена заказа.
  app.post('/orders/:id/cancel', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }
    const body = req.body as { reason?: string }
    const reason = (body.reason ?? '').trim()
    if (!reason) return reply.status(400).send({ error: 'reason required' })

    const order = await db.order.findUnique({
      where: { id: Number(id) },
      include: { responses: { where: { status: 'accepted' }, take: 1 } },
    })
    if (!order) return reply.status(404).send({ error: 'Not found' })

    const executor = order.responses[0]
    const isAuthor = order.authorId === userId
    const isExecutor = executor?.userId === userId
    if (!isAuthor && !isExecutor) return reply.status(403).send({ error: 'Forbidden' })

    if (!(NON_TERMINAL_STATUSES as readonly string[]).includes(order.status)) {
      return reply.status(409).send({ error: 'Order already finalized' })
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: { status: 'cancelled', cancelReason: reason } as never,
    })

    const otherUserId = isAuthor ? executor?.userId : order.authorId
    if (otherUserId) {
      notify(otherUserId, messages.orderCancelled(order.description, reason)).catch(() => {})
    }

    return reply.send(updated)
  })

  // Завершить заказ (переход awaiting_rating → completed). В демо вызывается из заглушки «Оценить».
  app.post('/orders/:id/complete', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }

    const order = await db.order.findUnique({
      where: { id: Number(id) },
      include: { responses: { where: { status: 'accepted' }, take: 1 } },
    })
    if (!order) return reply.status(404).send({ error: 'Not found' })

    const executor = order.responses[0]
    const isAuthor = order.authorId === userId
    const isExecutor = executor?.userId === userId
    if (!isAuthor && !isExecutor) return reply.status(403).send({ error: 'Forbidden' })

    if (order.status !== 'awaiting_rating') {
      return reply.status(409).send({ error: 'Order is not in awaiting_rating' })
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: { status: 'completed' } as never,
    })

    return reply.send(updated)
  })
}

// ─── Match Score ──────────────────────────────────────────────────────────────
// Считает релевантность заявки для конкретного пользователя.
// Максимум 100 очков. Используется для сортировки ленты.

type OrderForScore = {
  city: string | null
  contract: string
  createdAt: Date
  author: { rating: number }
}

type ViewerForScore = { city: string | null; contract: boolean } | null

function matchScore(order: OrderForScore, viewer: ViewerForScore): number {
  let score = 0

  // +30 — город совпадает
  if (viewer?.city && order.city && viewer.city === order.city) score += 30

  // +20 — предпочтение по договору совпадает
  if (viewer?.contract && order.contract === 'contract') score += 20

  // 0–20 — рейтинг автора (4.8 → 18, 5.0 → 20)
  score += Math.min(Math.round(order.author.rating * 4), 20)

  // 0–30 — свежесть: теряет 1 очко в сутки, полностью гаснет за 30 дней
  const ageInDays = (Date.now() - new Date(order.createdAt).getTime()) / 86_400_000
  score += Math.max(0, 30 - Math.floor(ageInDays))

  return score
}
