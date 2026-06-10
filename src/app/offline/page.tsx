'use client'

import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false)

  const retry = async () => {
    setRetrying(true)
    try {
      await fetch('/api/health', { cache: 'no-store' })
      window.location.href = '/'
    } catch {
      setRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 select-none">📡</div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Sem conexão</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Você está offline. Verifique sua conexão com a internet e tente novamente.
        </p>
        <button
          onClick={retry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground
                     rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          {retrying ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verificando…
            </>
          ) : (
            'Tentar novamente'
          )}
        </button>
      </div>
    </div>
  )
}
