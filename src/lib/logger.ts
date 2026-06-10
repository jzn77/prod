/**
 * Logger de produção usando Pino.
 * Em desenvolvimento usa pino-pretty para output legível.
 * Em produção usa JSON estruturado (compatível com Datadog, Logtail, etc.)
 */
import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
  base: {
    env:     process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
  redact: {
    paths: ['password', 'passwordHash', 'token', 'authorization', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
})

/** Cria um child logger com contexto adicional */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}
