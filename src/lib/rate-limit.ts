/**
 * Rate Limiting em memória com LRU Cache.
 * Em produção com múltiplas instâncias, substitua por Upstash Redis:
 *   npm install @upstash/ratelimit @upstash/redis
 *
 * Configuração por rota:
 *   - API geral:       100 req / 60s por IP
 *   - Auth endpoints:  10 req  / 60s por IP  (proteção brute-force)
 *   - IA:              20 req  / 60s por usuário
 */
import { LRUCache } from 'lru-cache'
import type { NextRequest } from 'next/server'

interface RateLimitOptions {
  limit:        number  // máximo de requests
  windowMs:     number  // janela em ms
}

interface RateLimitEntry {
  count:     number
  resetTime: number
}

// Cache com TTL automático
const cache = new LRUCache<string, RateLimitEntry>({
  max:  10_000,
  ttl:  60_000, // 1 min default
})

export function rateLimit(options: RateLimitOptions) {
  const { limit, windowMs } = options

  return function check(identifier: string): {
    success:   boolean
    remaining: number
    resetTime: number
    headers:   Record<string, string>
  } {
    const now = Date.now()
    const entry = cache.get(identifier)

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = { count: 1, resetTime: now + windowMs }
      cache.set(identifier, newEntry, { ttl: windowMs })
      return {
        success:   true,
        remaining: limit - 1,
        resetTime: newEntry.resetTime,
        headers: {
          'X-RateLimit-Limit':     String(limit),
          'X-RateLimit-Remaining': String(limit - 1),
          'X-RateLimit-Reset':     String(Math.ceil(newEntry.resetTime / 1000)),
        },
      }
    }

    entry.count++
    cache.set(identifier, entry)

    const remaining = Math.max(0, limit - entry.count)
    const success   = entry.count <= limit

    return {
      success,
      remaining,
      resetTime: entry.resetTime,
      headers: {
        'X-RateLimit-Limit':     String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset':     String(Math.ceil(entry.resetTime / 1000)),
        ...(success ? {} : { 'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)) }),
      },
    }
  }
}

/** Extrai o IP real do request (respeita proxies Vercel/Cloudflare) */
export function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    '127.0.0.1'
  )
}

// Instâncias pré-configuradas para reuso
export const apiLimiter  = rateLimit({ limit: 100, windowMs: 60_000 })
export const authLimiter = rateLimit({ limit: 10,  windowMs: 60_000 })
export const aiLimiter   = rateLimit({ limit: 20,  windowMs: 60_000 })
