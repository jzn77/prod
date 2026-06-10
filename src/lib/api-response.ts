/**
 * Helpers para respostas de API padronizadas.
 * Garante formato consistente e adiciona headers de segurança.
 */
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from './logger'

type SuccessOptions = {
  status?: number
  headers?: Record<string, string>
}

/** Resposta de sucesso padronizada */
export function ok<T>(data: T, options: SuccessOptions = {}) {
  const { status = 200, headers = {} } = options
  return NextResponse.json({ success: true, data }, { status, headers })
}

/** Resposta de criação */
export function created<T>(data: T) {
  return ok(data, { status: 201 })
}

/** Resposta de erro padronizada */
export function error(
  message: string,
  status  = 500,
  details?: unknown,
  headers?: Record<string, string>,
) {
  if (status >= 500) {
    logger.error({ message, details }, 'API Error')
  }
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status, headers },
  )
}

/** Trata erros Zod automaticamente */
export function zodError(err: ZodError) {
  const details = err.errors.map(e => ({
    field:   e.path.join('.'),
    message: e.message,
  }))
  return error('Dados inválidos', 400, details)
}

/** Wrapper que captura exceções em handlers de API */
export function withErrorHandler(
  handler: (req: Request, ctx?: unknown) => Promise<NextResponse>,
) {
  return async (req: Request, ctx?: unknown) => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      if (err instanceof ZodError) return zodError(err)
      logger.error(err, 'Unhandled API error')
      return error('Erro interno do servidor', 500)
    }
  }
}
