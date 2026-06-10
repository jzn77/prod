import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

const schema = z.object({
  name:     z.string().min(2).max(100).trim(),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
})

const IS_PROD = process.env.NODE_ENV === 'production'
const COOKIE_BASE = { httpOnly: true, secure: IS_PROD, sameSite: 'lax' as const, path: '/' }

const DEFAULT_CATEGORIES = [
  { name: 'Moradia',     type: 'EXPENSE' as const, icon: '🏠', color: '#6366f1' },
  { name: 'Transporte',  type: 'EXPENSE' as const, icon: '🚗', color: '#8b5cf6' },
  { name: 'Alimentação', type: 'EXPENSE' as const, icon: '🍔', color: '#f59e0b' },
  { name: 'Saúde',       type: 'EXPENSE' as const, icon: '💊', color: '#ef4444' },
  { name: 'Lazer',       type: 'EXPENSE' as const, icon: '🎮', color: '#ec4899' },
  { name: 'Educação',    type: 'EXPENSE' as const, icon: '📚', color: '#3b82f6' },
  { name: 'Compras',     type: 'EXPENSE' as const, icon: '🛒', color: '#06b6d4' },
  { name: 'Impostos',    type: 'EXPENSE' as const, icon: '📋', color: '#94a3b8' },
  { name: 'Outros',      type: 'EXPENSE' as const, icon: '📦', color: '#64748b' },
  { name: 'Salário',     type: 'INCOME'  as const, icon: '💰', color: '#10b981' },
  { name: 'Freelancer',  type: 'INCOME'  as const, icon: '💻', color: '#059669' },
  { name: 'Investimentos', type: 'INCOME' as const, icon: '📈', color: '#0ea5e9' },
]

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = schema.parse(await req.json())

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Este e-mail já está cadastrado' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    // Cria usuário + settings + conta padrão em transação
    const user = await prisma.$transaction(async tx => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash, settings: { create: {} } },
      })

      // Categorias financeiras padrão
      await tx.financialCategory.createMany({
        data: DEFAULT_CATEGORIES.map(c => ({
          ...c,
          userId:   newUser.id,
          isSystem: true,
        })),
      })

      // Conta bancária padrão
      await tx.financialAccount.create({
        data: { userId: newUser.id, name: 'Conta Corrente', type: 'CHECKING', balance: 0 },
      })

      return newUser
    })

    // E-mail de boas-vindas (não bloqueia resposta)
    sendWelcomeEmail(email, name).catch(err => logger.warn(err, 'Welcome email failed'))

    const accessToken  = signAccessToken({ sub: user.id, email: user.email })
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email })

    const { passwordHash: _, ...safeUser } = user
    logger.info({ userId: user.id }, 'User registered')

    const response = NextResponse.json({ success: true, data: safeUser }, { status: 201 })
    response.cookies.set('personal_hub_token',   accessToken,  { ...COOKIE_BASE, maxAge: 15 * 60 })
    response.cookies.set('personal_hub_refresh', refreshToken, { ...COOKIE_BASE, maxAge: 30 * 24 * 60 * 60 })
    return response
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    logger.error(err, '[POST /api/auth/register]')
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
