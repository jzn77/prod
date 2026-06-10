'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/** Captura erros no root layout */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>💥</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Erro crítico</h1>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            Ocorreu um erro no carregamento do sistema. Por favor, tente novamente.
          </p>
          {error.digest && (
            <code style={{ fontSize: 12, background: '#e2e8f0', padding: '4px 8px', borderRadius: 6, display: 'block', marginBottom: 24 }}>
              {error.digest}
            </code>
          )}
          <button
            onClick={reset}
            style={{ padding: '12px 32px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
