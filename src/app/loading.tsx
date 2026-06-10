/** Loading state do root — exibido durante SSR/navegação */
export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 bg-primary rounded-full opacity-30 animate-ping" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Carregando Personal Hub…
        </p>
      </div>
    </div>
  )
}
