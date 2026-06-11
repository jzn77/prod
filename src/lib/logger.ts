/**
 * Logger leve — sem dependências externas, compatível com Vercel/Edge.
 * Emite JSON estruturado em produção e texto legível em desenvolvimento.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDev  = process.env.NODE_ENV === 'development'
const level  = (process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info')) as LogLevel

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function shouldLog(l: LogLevel) {
  return LEVELS[l] >= LEVELS[level]
}

function redact(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj
  const copy: Record<string, unknown> = { ...(obj as Record<string, unknown>) }
  for (const key of Object.keys(copy)) {
    if (/password|token|secret|hash|authorization/i.test(key)) {
      copy[key] = '[REDACTED]'
    } else if (typeof copy[key] === 'object') {
      copy[key] = redact(copy[key])
    }
  }
  return copy
}

function log(lvl: LogLevel, data: unknown, msg?: string) {
  if (!shouldLog(lvl)) return
  const entry = {
    level:     lvl,
    time:      new Date().toISOString(),
    msg:       msg ?? (typeof data === 'string' ? data : ''),
    ...(typeof data === 'object' && data !== null ? redact(data) : {}),
  }
  const out = isDev
    ? `[${lvl.toUpperCase()}] ${entry.msg} ${JSON.stringify(entry, null, 0)}`
    : JSON.stringify(entry)

  if (lvl === 'error' || lvl === 'warn') console.error(out)
  else console.log(out)
}

export const logger = {
  debug: (data: unknown, msg?: string) => log('debug', data, msg),
  info:  (data: unknown, msg?: string) => log('info',  data, msg),
  warn:  (data: unknown, msg?: string) => log('warn',  data, msg),
  error: (data: unknown, msg?: string) => log('error', data, msg),
  child: (ctx: Record<string, unknown>) => ({
    debug: (d: unknown, m?: string) => log('debug', { ...ctx, ...(typeof d === 'object' ? d as object : { msg: d }) }, m),
    info:  (d: unknown, m?: string) => log('info',  { ...ctx, ...(typeof d === 'object' ? d as object : { msg: d }) }, m),
    warn:  (d: unknown, m?: string) => log('warn',  { ...ctx, ...(typeof d === 'object' ? d as object : { msg: d }) }, m),
    error: (d: unknown, m?: string) => log('error', { ...ctx, ...(typeof d === 'object' ? d as object : { msg: d }) }, m),
  }),
}

export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}
