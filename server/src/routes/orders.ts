import type { FastifyInstance } from 'fastify'
import db from '../lib/db.js'
import type { ContractType, OrderMode, ResponseStatus } from '@prisma/client'

export default async function orderRoutes(app: FastifyInstance) {
  // Лента заявок
  app.get('/orders', { onRequest: [app.authenticate] }, async (req, reply) => {
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

    if (query.role) {
      where.author = { role: query.role }
    }

    const orders = await db.order.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            rating: true,
            avatarUrl: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit ?? 20),
      skip: Number(query.offset ?? 0),
    })

    return reply.send(orders)
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

    if (status === 'accepted') {
      await db.notification.create({
        data: {
          userId: response.userId,
          text: 'Ваш отклик принят!',
        },
      })
    }

    return reply.send(updated)
  })
}
