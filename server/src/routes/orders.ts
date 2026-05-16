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
            select: { id: true, name: true, role: true, rating: true, ratingCount: true, avatarUrl: true, verified: true },
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
          select: { id: true, name: true, role: true, rating: true, ratingCount: true, avatarUrl: true, verified: true },
        },
        _count: { select: { responses: true } },
      },
    })

    if (!order) return reply.status(404).send({ error: 'Not found' })
    return reply.send(order)
  })

  // Создать заявку. Ограничение: у одного пользователя не может быть двух
  // активных заявок одного и того же режима. Терминальные статусы
  // (completed/cancelled/closed) не считаются. Это даёт по одной заявке на
  // «обычный» и «тойский» режим — авторы не плодят дубликаты, исполнители
  // видят аккуратную ленту.
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

    const mode = body.mode ?? 'normal'
    const existingActive = await db.order.findFirst({
      where: {
        authorId: userId,
        mode,
        status: { notIn: ['completed', 'cancelled', 'closed'] },
      },
      select: { id: true, orderNumber: true },
    })
    if (existingActive) {
      return reply.status(409).send({
        error: 'active_order_exists',
        message: `У вас уже есть активная заявка #${existingActive.orderNumber} (${mode === 'toi' ? 'тойский' : 'обычный'} режим). Завершите или отмените её перед созданием новой.`,
        existingOrderId: existingActive.id,
      })
    }

    const order = await db.order.create({
      data: {
        authorId: userId,
        price: body.price,
        description: body.description,
        city: body.city,
        date: body.date,
        contract: body.contract ?? 'cash',
        mode,
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

  // Мои отклики. По умолчанию скрываем отозванные (status='withdrawn') —
  // они нужны только для аудита/истории. Чтобы запросить вместе с ними,
  // передайте ?includeWithdrawn=1.
  app.get('/responses', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const query = req.query as { includeWithdrawn?: string }

    const where: Record<string, unknown> = { userId }
    if (!query.includeWithdrawn) {
      where.status = { not: 'withdrawn' }
    }

    const responses = await db.response.findMany({
      where,
      include: {
        order: {
          include: {
            author: {
              select: { id: true, name: true, role: true, rating: true, ratingCount: true, avatarUrl: true, verified: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send(responses)
  })

  // Отклики на мои заявки (для автора). Отозванные исполнителем не
  // показываем — их больше нет в очереди ожидания.
  app.get('/orders/:id/responses', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }

    const order = await db.order.findUnique({ where: { id: Number(id) } })
    if (!order) return reply.status(404).send({ error: 'Not found' })
    if (order.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const responses = await db.response.findMany({
      where: { orderId: Number(id), status: { not: 'withdrawn' } },
      include: {
        user: {
          select: { id: true, name: true, role: true, rating: true, ratingCount: true, avatarUrl: true, verified: true },
        },
      },
    })

    return reply.send(responses)
  })

  // Мой отклик на конкретный заказ (для UI: показать кнопку «Отозвать»
  // или «Откликнуться»). Возвращает 204, если пользователь ещё не
  // откликался — это нормальный сценарий, а не 404.
  app.get('/orders/:id/my-response', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }
    const response = await db.response.findUnique({
      where: { orderId_userId: { orderId: Number(id), userId } },
    })
    if (!response) return reply.status(204).send()
    return reply.send(response)
  })

  // Отозвать собственный отклик. Допустимо только пока status='waiting' —
  // если автор уже принял или отклонил, отозвать нельзя (нет смысла).
  app.post('/responses/:id/withdraw', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }

    const response = await db.response.findUnique({
      where: { id: Number(id) },
      include: { order: true },
    })
    if (!response) return reply.status(404).send({ error: 'Not found' })
    if (response.userId !== userId) return reply.status(403).send({ error: 'Forbidden' })
    if (response.status !== 'waiting') {
      return reply.status(409).send({ error: 'Can only withdraw waiting responses' })
    }

    const updated = await db.response.update({
      where: { id: response.id },
      data: { status: 'withdrawn', withdrawnAt: new Date() } as never,
    })

    return reply.send(updated)
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

  // Завершить заказ (переход awaiting_rating → completed). Escape hatch на
  // случай, если одна из сторон не оставит отзыв — обычно заказ завершается
  // автоматически из POST /orders/:id/review, когда обе стороны отрецензировали.
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

  // ─── Отзывы ────────────────────────────────────────────────────────────────

  // Оставить отзыв по выполненному заказу. Доступно автору и исполнителю.
  // Заказ должен быть в awaiting_rating. Когда обе стороны оставили отзыв —
  // заказ автоматически переходит в completed.
  app.post('/orders/:id/review', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }
    const body = req.body as { stars?: number; text?: string }

    const stars = Number(body.stars)
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return reply.status(400).send({ error: 'stars must be integer 1..5' })
    }
    const text = (body.text ?? '').trim()
    if (text.length > 280) {
      return reply.status(400).send({ error: 'text too long (280 max)' })
    }

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

    const toUserId = isAuthor ? executor!.userId : order.authorId

    // Проверяем, не оставлял ли пользователь уже отзыв (unique constraint
    // дополнительно ловит гонки, но явная проверка даёт чистую 409).
    const existing = await db.review.findUnique({
      where: { orderId_fromUserId: { orderId: order.id, fromUserId: userId } },
    })
    if (existing) return reply.status(409).send({ error: 'Already reviewed' })

    // Создаём отзыв, пересчитываем средний рейтинг адресата, и если это второй
    // отзыв по заказу — переводим в completed. Всё в транзакции, чтобы не
    // получить полузаписанное состояние.
    const result = await db.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          orderId: order.id,
          fromUserId: userId,
          toUserId,
          stars,
          text: text || null,
        },
      })

      // Пересчёт среднего по живым отзывам: средний * count = старая сумма;
      // новая сумма + stars / (count+1) = новое среднее. Делаем агрегатом —
      // надёжнее против ошибок округления, дешевле чем тянуть все строки.
      const agg = await tx.review.aggregate({
        where: { toUserId },
        _avg: { stars: true },
        _count: true,
      })
      await tx.user.update({
        where: { id: toUserId },
        data: {
          rating: agg._avg.stars ?? 0,
          ratingCount: agg._count,
        },
      })

      // Сколько отзывов по этому заказу? Если 2 — переводим в completed.
      const reviewsForOrder = await tx.review.count({ where: { orderId: order.id } })
      const orderAfter =
        reviewsForOrder >= 2
          ? await tx.order.update({
              where: { id: order.id },
              data: { status: 'completed' } as never,
            })
          : order

      return { review, orderAfter, completed: reviewsForOrder >= 2 }
    })

    // Уведомляем адресата отзыва.
    const fromUser = await db.user.findUnique({ where: { id: userId }, select: { name: true } })
    if (fromUser) {
      notify(toUserId, messages.reviewReceived(stars, fromUser.name, order.description)).catch(() => {})
    }
    // Если только первая сторона оставила — напомним второй.
    if (!result.completed) {
      notify(toUserId, messages.awaitingYourReview(order.description)).catch(() => {})
    }

    return reply.status(201).send(result.review)
  })

  // Отзывы, оставленные на конкретного пользователя.
  app.get('/users/:id/reviews', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const reviews = await db.review.findMany({
      where: { toUserId: Number(id) },
      include: {
        fromUser: { select: { id: true, name: true, role: true, avatarUrl: true } },
        order: { select: { id: true, description: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send(reviews)
  })

  // Отзыв текущего пользователя по конкретному заказу (для UI: показать форму
  // или «вы уже оценили»). Возвращает 204 если не оставлял.
  app.get('/orders/:id/my-review', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number }
    const { id } = req.params as { id: string }
    const review = await db.review.findUnique({
      where: { orderId_fromUserId: { orderId: Number(id), fromUserId: userId } },
    })
    if (!review) return reply.status(204).send()
    return reply.send(review)
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
