/**
 * GET /api/health
 * Endpoint público para healthchecks (Vercel, Railway, uptime monitors).
 * Verifica conectividade com o banco de dados.
 */
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  let dbStatus: 'ok' | 'error' = 'ok'
  let dbLatency = 0

  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - dbStart
  } catch {
    dbStatus = 'error'
  }

  const totalLatency = Date.now() - start
  const status = dbStatus === 'ok' ? 200 : 503

  return NextResponse.json(
    {
      status:  dbStatus === 'ok' ? 'healthy' : 'degraded',
      version: process.env.npm_package_version ?? '1.0.0',
      env:     process.env.NODE_ENV,
      uptime:  process.uptime(),
      latency: { total: totalLatency, db: dbLatency },
      checks: { database: dbStatus },
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type':  'application/json',
      },
    },
  )
}
