/**
 * POST /api/auth/change-password
 * Altera a senha do usuário autenticado.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser, comparePassword, hashPassword, clearAuthCookies } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = schema.parse(await req.json())

    const valid = await comparePassword(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Senha atual incorreta' }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'A nova senha deve ser diferente da atual' },
        { status: 400 },
      )
    }

    const newHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash: newHash },
    })

    logger.info({ userId: user.id }, 'Password changed')

    // Invalida sessões forçando novo login (limpa cookies)
    const response = NextResponse.json({ success: true, message: 'Senha alterada com sucesso. Faça login novamente.' })
    response.cookies.delete('personal_hub_token')
    response.cookies.delete('personal_hub_refresh')
    return response
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    logger.error(err, 'Change password error')
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
