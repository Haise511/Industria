export interface FilterState {
  role: string | null   // 'artist' | 'studio' | 'composer' | 'customer' | null
  sort: string          // 'default' | 'newest' | 'price-desc' | 'price-asc' | 'rating'
  contract: boolean
  minRating: number | null
  city: string | null
}

const defaults: FilterState = {
  role: null,
  sort: 'default',
  contract: false,
  minRating: null,
  city: null,
}

let current: FilterState = { ...defaults }
const listeners: Array<() => void> = []

export const filterStore = {
  get(): FilterState {
    return current
  },
  set(patch: Partial<FilterState>) {
    current = { ...current, ...patch }
    listeners.forEach(fn => fn())
  },
  reset() {
    current = { ...defaults }
    listeners.forEach(fn => fn())
  },
  subscribe(fn: () => void): () => void {
    listeners.push(fn)
    return () => {
      const i = listeners.indexOf(fn)
      if (i !== -1) listeners.splice(i, 1)
    }
  },
}
