/**
 * Rate Limiting simples com Map nativa — sem dependências.
 * Para múltiplas instâncias em produção, migre para Upstash Redis.
 */
import type { NextRequest } from 'next/server'

interface Entry { count: number; resetTime: number }

const store = new Map<string, Entry>()

// Limpa entradas expiradas a cada 5 min
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((v, k) => { if (now > v.resetTime) store.delete(k) })
  }, 5 * 60_000)
}

export function rateLimit(limit: number, windowMs: number) {
  return function check(id: string) {
    const now   = Date.now()
    const entry = store.get(id)

    if (!entry || now > entry.resetTime) {
      store.set(id, { count: 1, resetTime: now + windowMs })
      return { success: true, remaining: limit - 1 }
    }

    entry.count++
    const success   = entry.count <= limit
    const remaining = Math.max(0, limit - entry.count)
    return { success, remaining }
  }
}

export function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}

export const apiLimiter  = rateLimit(100, 60_000)
export const authLimiter = rateLimit(10,  60_000)
export const aiLimiter   = rateLimit(20,  60_000)
