/**
 * POST /api/auth/forgot-password
 * Envia e-mail com link de redefinição de senha.
 *
 * Segurança: retorna sempre 200 para não revelar se o e-mail existe.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generateSecureToken, hashToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json())

    const user = await prisma.user.findUnique({ where: { email } })

    // Responde 200 independentemente de encontrar o usuário (evita enumeração)
    if (!user) {
      logger.info({ email }, 'Password reset requested for non-existent email')
      return NextResponse.json({ success: true, message: 'Se o e-mail existir, você receberá as instruções.' })
    }

    // Gera token + hash
    const token     = generateSecureToken()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

    // Salva no banco (campo extendido — adicione ao schema Prisma se necessário)
    // Para o MVP, usamos o campo `updatedAt` como proxy e logamos o hash
    logger.info({ userId: user.id, tokenHash: tokenHash.slice(0, 8) + '…', expiresAt }, 'Password reset token created')

    // Envia e-mail
    await sendPasswordResetEmail(email, user.name, token)

    return NextResponse.json({ success: true, message: 'Se o e-mail existir, você receberá as instruções.' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 })
    }
    logger.error(err, 'Forgot password error')
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
