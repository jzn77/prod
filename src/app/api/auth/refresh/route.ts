/**
 * POST /api/auth/refresh
 * Troca o refresh token por um novo par access + refresh (rotação automática).
 * Chamado pelo cliente quando o access token expira (401).
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookie,
} from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

const ACCESS_COOKIE  = 'personal_hub_token'
const REFRESH_COOKIE = 'personal_hub_refresh'
const IS_PROD = process.env.NODE_ENV === 'production'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, error: 'Refresh token não encontrado' },
      { status: 401 },
    )
  }

  try {
    const payload = verifyRefreshToken(refreshToken)

    // Verifica se o usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 401 },
      )
    }

    // Emite novos tokens (rotação)
    const newAccessToken  = signAccessToken({ sub: user.id, email: user.email })
    const newRefreshToken = signRefreshToken({ sub: user.id, email: user.email })

    const response = NextResponse.json({ success: true, message: 'Token renovado' })

    const COOKIE_BASE = { httpOnly: true, secure: IS_PROD, sameSite: 'lax' as const, path: '/' }

    response.cookies.set(ACCESS_COOKIE,  newAccessToken,  { ...COOKIE_BASE, maxAge: 15 * 60 })
    response.cookies.set(REFRESH_COOKIE, newRefreshToken, { ...COOKIE_BASE, maxAge: 30 * 24 * 60 * 60 })

    logger.info({ userId: user.id }, 'Token refreshed')
    return response
  } catch (err) {
    logger.warn({ err }, 'Invalid refresh token')
    const response = NextResponse.json(
      { success: false, error: 'Refresh token inválido ou expirado' },
      { status: 401 },
    )
    response.cookies.delete(ACCESS_COOKIE)
    response.cookies.delete(REFRESH_COOKIE)
    return response
  }
}
