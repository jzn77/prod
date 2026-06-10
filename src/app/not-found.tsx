import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Página não encontrada' }

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md animate-in">
        <div className="text-8xl mb-6 select-none">🔍</div>
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-3">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary
                       text-primary-foreground rounded-xl font-semibold hover:bg-primary/90
                       transition-all"
          >
            Ir para o Dashboard
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border
                       border-border rounded-xl font-semibold hover:bg-muted transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
