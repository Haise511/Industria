const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

// Variant that tolerates 204 (No Content) — returns null instead of crashing
// on the empty-body json parse. Used by endpoints that legitimately return
// "no resource yet" rather than 404 (e.g. /orders/:id/my-review).
async function requestMaybe<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (res.status === 204) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'artist' | 'customer' | 'studio' | 'composer'

export interface ApiUser {
  id: number
  telegramId: string
  name: string
  username: string | null
  role: UserRole
  city: string | null
  bio: string | null
  avatarUrl: string | null
  rating: number
  verified: boolean
  contract: boolean
  language: string
}

export type OrderLifecycleStatus =
  | 'open'
  | 'awaiting_date'
  | 'today'
  | 'awaiting_confirmation'
  | 'awaiting_rating'
  | 'completed'
  | 'cancelled'
  | 'closed'

export interface ApiOrder {
  id: number
  orderNumber?: number
  price: number
  description: string
  city: string | null
  date: string | null
  contract: 'contract' | 'cash'
  mode: 'normal' | 'toi'
  status: OrderLifecycleStatus
  editFrozen?: boolean
  cancelReason?: string | null
  confirmedAt?: string | null
  confirmedByAuthor?: boolean
  confirmedByExecutor?: boolean
  acceptedResponseId?: number | null
  score?: number
  author: {
    id: number
    name: string
    role: UserRole
    rating: number
    ratingCount?: number
    avatarUrl: string | null
    verified: boolean
  }
}

export type ResponseLifecycle = 'waiting' | 'accepted' | 'rejected' | 'withdrawn'

export interface ApiResponse {
  id: number
  orderId: number
  userId: number
  date: string | null
  comment: string | null
  status: ResponseLifecycle
  withdrawnAt?: string | null
  order: ApiOrder
  user?: {
    id: number
    name: string
    role: UserRole
    rating: number
    ratingCount?: number
    avatarUrl: string | null
    verified: boolean
  }
}

export interface ApiReview {
  id: number
  orderId: number
  fromUserId: number
  toUserId: number
  stars: number
  text: string | null
  createdAt: string
  fromUser?: {
    id: number
    name: string
    role: UserRole
    avatarUrl: string | null
  }
  order?: {
    id: number
    description: string
    orderNumber?: number
  }
}

/** Format the displayed rating per the CLAUDE.md tiered rules:
 *    - 0..2 reviews   → "Новый" (no numeric badge)
 *    - 3..9 reviews   → max(rating, 3.0)
 *    - 10+ reviews    → raw rating
 *  Returns `null` when the user has fewer than 3 reviews, so the UI can fall
 *  back to a "Новый" pill instead of a stale "0.0". */
export function formatRatingTier(rating: number, count: number): number | null {
  if (count < 3) return null
  if (count < 10) return Math.max(rating, 3.0)
  return rating
}

export interface ApiNotification {
  id: number
  text: string           // legacy single-line — used as title when `title` is absent
  title?: string
  body?: string
  read: boolean
  createdAt: string
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

import type { Order } from './components/OrderCard'

const MONTHS_RU_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

/** Convert "YYYY-MM-DD" → "DD-monthRu" (e.g. "2026-05-12" → "12-мая").
 *  If the input isn't strict ISO (e.g. already formatted as a range like
 *  "12–15 мая 2026" from DatePicker), return as-is. */
function formatDateRu(s: string | null | undefined): string | undefined {
  if (!s) return undefined
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return s
  const day = Number(m[3])
  const month = MONTHS_RU_GEN[Number(m[2]) - 1] ?? ''
  return `${day}-${month}`
}

export function toOrder(o: ApiOrder, status?: Order['status']): Order {
  const price = o.price.toLocaleString('ru-RU') + ' сом'
  // Применяем порог "Новый" — карточки без достаточного числа отзывов
  // показывают пилюлю «Новый» вместо числового рейтинга. Это решение
  // продиктовано спекой CLAUDE.md (раздел «Рейтинг и отзывы»).
  const tier = formatRatingTier(o.author.rating, o.author.ratingCount ?? 0)
  return {
    id: String(o.id),
    price,
    contract: o.contract,
    city: o.city ?? undefined,
    date: formatDateRu(o.date),
    description: o.description,
    authorName: o.author.name,
    authorRole: o.author.role as Order['authorRole'],
    authorRating: tier ?? undefined,
    authorIsNew: tier === null,
    authorAvatar: o.author.avatarUrl ?? undefined,
    verified: o.author.verified,
    status: status ?? null,
    lifecycle: o.status,
    score: o.score,
  }
}

export function toResponseOrder(r: ApiResponse): Order {
  return toOrder(r.order, r.status)
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const api = {
  auth(initData: string) {
    return request<{ token: string; user: ApiUser; isNew: boolean }>('/auth', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    })
  },

  getProfile() {
    return request<ApiUser>('/profile')
  },

  updateProfile(data: Partial<Pick<ApiUser, 'name' | 'role' | 'city' | 'bio' | 'avatarUrl' | 'contract' | 'language'>>) {
    return request<ApiUser>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  getOrders(params?: { mode?: string; role?: string }) {
    const q = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<ApiOrder[]>(`/orders${q ? `?${q}` : ''}`)
  },

  getOrderById(id: string) {
    return request<ApiOrder>(`/orders/${id}`)
  },

  createOrder(data: { price: number; description: string; city?: string; date?: string; contract?: string; mode?: string }) {
    return request<ApiOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getMyOrders() {
    return request<ApiOrder[]>('/orders/my')
  },

  getResponses() {
    return request<ApiResponse[]>('/responses')
  },

  respondToOrder(orderId: number, data: { date?: string; comment?: string }) {
    return request<ApiResponse>(`/orders/${orderId}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getOrderResponses(orderId: string) {
    return request<ApiResponse[]>(`/orders/${orderId}/responses`)
  },

  updateResponse(responseId: number, status: 'accepted' | 'rejected') {
    return request<ApiResponse>(`/responses/${responseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  // Текущий отклик пользователя на конкретный заказ. 204 → ещё не откликался.
  getMyResponseForOrder(orderId: number) {
    return requestMaybe<ApiResponse>(`/orders/${orderId}/my-response`)
  },

  // Отозвать собственный отклик (доступно только для status='waiting').
  withdrawResponse(responseId: number) {
    return request<ApiResponse>(`/responses/${responseId}/withdraw`, { method: 'POST' })
  },

  confirmOrder(orderId: number) {
    return request<ApiOrder>(`/orders/${orderId}/confirm`, { method: 'POST' })
  },

  cancelOrder(orderId: number, reason: string) {
    return request<ApiOrder>(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  completeOrder(orderId: number) {
    return request<ApiOrder>(`/orders/${orderId}/complete`, { method: 'POST' })
  },

  reviewOrder(orderId: number, data: { stars: number; text?: string }) {
    return request<ApiReview>(`/orders/${orderId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getMyReviewForOrder(orderId: number) {
    return requestMaybe<ApiReview>(`/orders/${orderId}/my-review`)
  },

  getUserReviews(userId: number) {
    return request<ApiReview[]>(`/users/${userId}/reviews`)
  },

  getNotifications() {
    return request<ApiNotification[]>('/notifications')
  },

  markNotificationsRead() {
    return request<{ ok: boolean }>('/notifications/read', { method: 'PATCH' })
  },
}
