import { createContext, useContext, useState, type ReactNode } from 'react'
import { type ApiUser, setToken, clearToken } from '../api'

interface AuthState {
  user: ApiUser | null
  isLoading: boolean
  setAuth: (user: ApiUser, token: string) => void
  setUser: (user: ApiUser) => void
  logout: () => void
  setLoading: (v: boolean) => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  setAuth: () => {},
  setUser: () => {},
  logout: () => {},
  setLoading: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<ApiUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setAuth = (user: ApiUser, token: string) => {
    setToken(token)
    setUserState(user)
  }

  const setUser = (user: ApiUser) => setUserState(user)

  const logout = () => {
    clearToken()
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setAuth, setUser, logout, setLoading: setIsLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
