'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Reporta para Sentry se disponível
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs')
        .then(Sentry => Sentry.captureException(error))
        .catch(() => {})
    }
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 select-none">⚠️</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Algo deu errado</h1>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6 font-mono bg-muted rounded-lg px-3 py-1.5 inline-block">
            ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary
                       text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
          >
            Tentar novamente
          </button>
          <a href="/"
            className="inline-flex items-center justify-center px-6 py-3 border
                       border-border rounded-xl font-semibold hover:bg-muted transition-all"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  )
}
