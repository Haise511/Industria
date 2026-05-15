import { bot } from '../bot/index.js'
import db from './db.js'

// Отправляет сообщение пользователю в Telegram и сохраняет в notifications.
export async function notify(userId: number, text: string): Promise<void> {
  // Сохраняем в БД всегда
  await db.notification.create({ data: { userId, text } })

  // Отправляем в Telegram если знаем telegramId
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { telegramId: true },
  })

  if (!user) return

  try {
    await bot.api.sendMessage(user.telegramId.toString(), text)
  } catch {
    // Пользователь не запускал бота — ничего страшного, уведомление в БД есть
  }
}

// ─── Готовые шаблоны ──────────────────────────────────────────────────────────

export const messages = {
  responseAccepted: (orderDesc: string) =>
    `✅ Ваш отклик принят!\n\nЗаявка: «${orderDesc.slice(0, 80)}...»\n\nПерейдите в приложение чтобы начать работу.`,

  responseRejected: (orderDesc: string) =>
    `❌ Ваш отклик отклонён.\n\nЗаявка: «${orderDesc.slice(0, 80)}...»`,

  orderCreated: (orderNumber: number, authorName: string, description: string) =>
    `📋 Новый заказ #${orderNumber}\n\nОт: ${authorName}\n\n«${description.slice(0, 120)}»\n\nОткройте приложение для деталей.`,

  orderDateToday: (orderDesc: string) =>
    `📅 Сегодня день заказа.\n\nЗаявка: «${orderDesc.slice(0, 80)}...»\n\nНе забудьте подтвердить выполнение в приложении.`,

  orderConfirmedByOther: (orderDesc: string) =>
    `🔔 Другая сторона подтвердила выполнение заказа.\n\nЗаявка: «${orderDesc.slice(0, 80)}...»\n\nПодтвердите со своей стороны.`,

  orderCompleted: (orderDesc: string) =>
    `🎉 Заказ завершён.\n\nЗаявка: «${orderDesc.slice(0, 80)}...»\n\nОставьте отзыв в приложении.`,

  orderCancelled: (orderDesc: string, reason: string) =>
    `🚫 Заказ отменён.\n\nЗаявка: «${orderDesc.slice(0, 80)}...»\nПричина: ${reason}`,

  subscriptionExpiresSoon: (days: number) =>
    `⏳ Подписка истекает через ${days} ${pluralDays(days)}.\n\nПродлите чтобы не потерять доступ к заявкам.`,

  subscriptionExpired: () =>
    `🔒 Ваша подписка закончилась.\n\nБез подписки лента скрыта. Продлите доступ через приложение.`,
}

function pluralDays(n: number): string {
  if (n === 1) return 'день'
  if (n < 5) return 'дня'
  return 'дней'
}
