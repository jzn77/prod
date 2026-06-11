// Sentry client config — ativo somente quando NEXT_PUBLIC_SENTRY_DSN estiver configurado
// Para ativar: npm install @sentry/nextjs e configure a variável de ambiente
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('@sentry/nextjs').then(Sentry => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      enabled: process.env.NODE_ENV === 'production',
    })
  }).catch(() => {/* Sentry não disponível */})
}
