'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/api'
import type { User } from '@/types'

interface AuthContextValue {
  user:        User | null
  loading:     boolean
  login:       (email: string, password: string) => Promise<void>
  register:    (name: string, email: string, password: string) => Promise<void>
  logout:      () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Carrega usuário ao montar
  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.me()
      setUser(res.data)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password)
    setUser(res.data)
    router.push('/')
  }, [router])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authService.register(name, email, password)
    setUser(res.data)
    router.push('/')
  }, [router])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
