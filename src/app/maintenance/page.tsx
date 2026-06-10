import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Em manutenção — Personal Hub' }

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 select-none">🔧</div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Em manutenção</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          O Personal Hub está passando por uma atualização planejada.
          Voltaremos em breve com melhorias!
        </p>
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-muted rounded-xl">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium text-muted-foreground">Estimativa: 15–30 minutos</p>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Status em tempo real:{' '}
          <a
            href="https://status.personalhub.app"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            status.personalhub.app
          </a>
        </p>
      </div>
    </div>
  )
}
