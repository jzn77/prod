// Sentry server config — ativo somente quando SENTRY_DSN estiver configurado
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('@sentry/nextjs').then(Sentry => {
    Sentry.init({
      dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === 'production',
    })
  }).catch(() => {/* Sentry não disponível */})
}
