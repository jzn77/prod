/**
 * Sentry — configuração do cliente (browser)
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Amostragem: captura 10% das sessões em produção para performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay: 10% das sessões, 100% em caso de erro
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText:   true,   // privacidade: não captura texto
      blockAllMedia: false,
    }),
  ],

  // Não captura erros de rede comuns (evita ruído)
  ignoreErrors: [
    'Network Error',
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    /^ResizeObserver loop/,
    'Non-Error promise rejection',
  ],

  // Filtra eventos antes de enviar
  beforeSend(event) {
    // Remove dados sensíveis
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    return event
  },

  enabled: process.env.NODE_ENV === 'production',
})
