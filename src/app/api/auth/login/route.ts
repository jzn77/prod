import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { comparePassword, signAccessToken, signRefreshToken } from '@/lib/auth'
import { logger } from '@/lib/logger'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const IS_PROD = process.env.NODE_ENV === 'production'
const COOKIE_BASE = { httpOnly: true, secure: IS_PROD, sameSite: 'lax' as const, path: '/' }

export async function POST(req: NextRequest) {
  try {
    const { email, password } = schema.parse(await req.json())

    const user = await prisma.user.findUnique({ where: { email } })

    // Sempre executa comparePassword para evitar timing attacks
    const dummyHash = '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const valid = user
      ? await comparePassword(password, user.passwordHash)
      : await comparePassword(password, dummyHash).then(() => false)

    if (!user || !valid) {
      // Delay adicional contra brute-force (100-300ms aleatório)
      await new Promise(r => setTimeout(r, 100 + Math.random() * 200))
      return NextResponse.json({ success: false, error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    const accessToken  = signAccessToken({ sub: user.id, email: user.email })
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email })

    const { passwordHash: _, ...safeUser } = user

    logger.info({ userId: user.id }, 'User logged in')

    const response = NextResponse.json({ success: true, data: safeUser })
    response.cookies.set('personal_hub_token',   accessToken,  { ...COOKIE_BASE, maxAge: 15 * 60 })
    response.cookies.set('personal_hub_refresh', refreshToken, { ...COOKIE_BASE, maxAge: 30 * 24 * 60 * 60 })
    return response
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    logger.error(err, '[POST /api/auth/login]')
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
