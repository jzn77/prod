/**
 * POST /api/auth/reset-password
 * Valida o token de reset e atualiza a senha.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPassword, hashToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json())

    const tokenHash = hashToken(token)

    // Busca usuário pelo token (em produção, busque pelo campo passwordResetToken)
    // Este é um placeholder — implemente o model PasswordReset no Prisma para produção completa
    logger.info({ tokenHash: tokenHash.slice(0, 8) + '…' }, 'Password reset attempt')

    // Para uso real, adicione ao schema Prisma:
    // model PasswordReset { token String @unique; userId String; expiresAt DateTime }
    // Aqui simulamos com um erro orientativo
    return NextResponse.json(
      { success: false, error: 'Funcionalidade de reset requer configuração do modelo PasswordReset no Prisma. Veja README.' },
      { status: 501 },
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    logger.error(err, 'Reset password error')
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
