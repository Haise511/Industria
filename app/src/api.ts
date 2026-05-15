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

export interface ApiOrder {
  id: number
  price: number
  description: string
  city: string | null
  date: string | null
  contract: 'contract' | 'cash'
  mode: 'normal' | 'toi'
  status: 'open' | 'closed'
  score?: number
  author: {
    id: number
    name: string
    role: UserRole
    rating: number
    avatarUrl: string | null
    verified: boolean
  }
}

export interface ApiResponse {
  id: number
  orderId: number
  userId: number
  date: string | null
  comment: string | null
  status: 'waiting' | 'accepted' | 'rejected'
  order: ApiOrder
}

export interface ApiNotification {
  id: number
  text: string
  read: boolean
  createdAt: string
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

import type { Order } from './components/OrderCard'

export function toOrder(o: ApiOrder, status?: Order['status']): Order {
  const price = o.price.toLocaleString('ru-RU') + ' сом'
  return {
    id: String(o.id),
    price,
    contract: o.contract,
    city: o.city ?? undefined,
    date: o.date ?? undefined,
    description: o.description,
    authorName: o.author.name,
    authorRole: o.author.role as Order['authorRole'],
    authorRating: o.author.rating > 0 ? o.author.rating : undefined,
    authorAvatar: o.author.avatarUrl ?? undefined,
    verified: o.author.verified,
    status: status ?? null,
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

  getNotifications() {
    return request<ApiNotification[]>('/notifications')
  },

  markNotificationsRead() {
    return request<{ ok: boolean }>('/notifications/read', { method: 'PATCH' })
  },
}
