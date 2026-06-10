'use client'

import { useQuery } from '@tanstack/react-query'
import {
  ListTodo, TrendingUp, Target, BookOpen, Wallet, FolderKanban,
  Clock, Cloud, CheckCircle2, AlertCircle, ArrowUpRight, Flame,
  Calendar, DollarSign, PiggyBank, CreditCard,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { dashboardService } from '@/services/api'
import { useAuth } from '@/contexts/auth-context'
import { formatCurrency, getGreeting, formatDuration, cn } from '@/utils/helpers'
import type { DashboardSummary } from '@/types'
import Link from 'next/link'

// ─── Summary Card ─────────────────────────────────────────

interface SummaryCardProps {
  title:      string
  value:      string | number
  subtitle?:  string
  icon:       React.ComponentType<{ className?: string }>
  iconColor?: string
  iconBg?:    string
  href?:      string
  trend?:     { value: number; label: string }
  alert?:     boolean
}

function SummaryCard({
  title, value, subtitle, icon: Icon, iconColor = 'text-primary',
  iconBg = 'bg-primary/10', href, trend, alert,
}: SummaryCardProps) {
  const content = (
    <div className={cn(
      'bg-card rounded-2xl p-5 border border-border shadow-card card-hover group',
      alert && 'border-orange-200 dark:border-orange-900/50',
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {href && (
          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
      )}
      {trend && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-medium',
          trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'
        )}>
          <TrendingUp className="w-3 h-3" />
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </div>
      )}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}

// ─── Main Dashboard ───────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const now = new Date()

  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn:  () => dashboardService.summary(),
  })

  const greeting  = getGreeting()
  const firstName = user?.name?.split(' ')[0] ?? 'João'
  const dateLabel = format(now, "EEEE, d 'de' MMMM", { locale: ptBR })
  const timeLabel = format(now, 'HH:mm')

  if (isLoading) return <DashboardSkeleton />

  const s = summary

  return (
    <div className="space-y-8">
      {/* ── Greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {greeting}, {firstName}. 👋
          </h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {dateLabel} &bull; {timeLabel}
          </p>
        </div>

        {/* Weather widget */}
        {s?.weather && (
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-card">
            <Cloud className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{s.weather.temp}°C — {s.weather.description}</p>
              <p className="text-xs text-muted-foreground">{s.weather.city}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Today overview ── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Resumo de hoje
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Tarefas de hoje"
            value={`${s?.todayTasks.done ?? 0}/${s?.todayTasks.total ?? 0}`}
            subtitle={s?.todayTasks.overdue ? `${s.todayTasks.overdue} atrasadas` : 'Em dia!'}
            icon={ListTodo}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50 dark:bg-indigo-950/40"
            href="/routine"
            alert={!!s?.todayTasks.overdue}
          />
          <SummaryCard
            title="Hábitos concluídos"
            value={`${s?.habitsToday.done ?? 0}/${s?.habitsToday.total ?? 0}`}
            subtitle={s?.habitsToday.done === s?.habitsToday.total ? 'Todos feitos!' : 'Continue!'}
            icon={Flame}
            iconColor="text-orange-500"
            iconBg="bg-orange-50 dark:bg-orange-950/40"
            href="/habits"
          />
          <SummaryCard
            title="Horas estudadas"
            value={formatDuration(s?.hoursStudied ?? 0)}
            subtitle="Hoje"
            icon={BookOpen}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-950/40"
            href="/studies"
          />
          <SummaryCard
            title="Gasto hoje"
            value={formatCurrency(s?.todayExpense ?? 0)}
            subtitle="Despesas do dia"
            icon={CreditCard}
            iconColor="text-rose-600"
            iconBg="bg-rose-50 dark:bg-rose-950/40"
            href="/finance"
          />
        </div>
      </section>

      {/* ── Main content grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial overview */}
          <section className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Visão Financeira</h2>
              <Link href="/finance" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver detalhes <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(s?.monthBalance ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Saldo do mês</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <PiggyBank className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {formatCurrency(s?.monthSavings ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Economizado</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                <Wallet className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                  {formatCurrency(s?.netWorth ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Patrimônio</p>
              </div>
            </div>
          </section>

          {/* Active projects */}
          <section className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Projetos Ativos</h2>
              <Link href="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s?.activeProjects ?? 0}</p>
                <p className="text-sm text-muted-foreground">projetos em andamento</p>
              </div>
            </div>
          </section>

          {/* Upcoming bills */}
          {s?.upcomingBills && s.upcomingBills.length > 0 && (
            <section className="bg-card rounded-2xl border border-border shadow-card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Contas a Vencer
                </h2>
                <Link href="/finance" className="text-xs text-primary hover:underline">Ver tudo</Link>
              </div>
              <div className="space-y-3">
                {s.upcomingBills.slice(0, 4).map(bill => (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{bill.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence: {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                    <span className="font-semibold text-red-600">{formatCurrency(bill.amount)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Next task */}
          {s?.nextTask && (
            <section className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Próxima Tarefa
              </h2>
              <div className={cn(
                'rounded-xl p-4 border',
                'bg-primary/5 border-primary/20',
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn('priority-dot mt-1.5', s.nextTask.priority)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.nextTask.title}</p>
                    {s.nextTask.scheduledAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(s.nextTask.scheduledAt), 'HH:mm')}
                      </p>
                    )}
                    {s.nextTask.estimatedMinutes && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ⏱ {formatDuration(s.nextTask.estimatedMinutes)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Daily goal */}
          {s?.dailyGoal && (
            <section className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Meta Diária
              </h2>
              <p className="font-medium text-sm">{s.dailyGoal.title}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{s.dailyGoal.currentValue} {s.dailyGoal.unit}</span>
                  <span>{s.dailyGoal.targetValue} {s.dailyGoal.unit}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(s.dailyGoal.progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-primary font-medium mt-1.5">
                  {s.dailyGoal.progress.toFixed(0)}% concluído
                </p>
              </div>
            </section>
          )}

          {/* Financial goal */}
          {s?.financialGoal && (
            <section className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-600" />
                Meta Financeira
              </h2>
              <p className="font-medium text-sm">{s.financialGoal.title}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{formatCurrency(s.financialGoal.currentValue)}</span>
                  <span>{formatCurrency(s.financialGoal.targetValue)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(s.financialGoal.progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-600 font-medium mt-1.5">
                  {s.financialGoal.progress.toFixed(0)}% da meta
                </p>
              </div>
            </section>
          )}

          {/* Quick actions */}
          <section className="bg-card rounded-2xl border border-border shadow-card p-5">
            <h2 className="font-semibold mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Nova Tarefa',    href: '/routine',  icon: ListTodo,     color: 'text-indigo-600' },
                { label: 'Registrar Gasto', href: '/finance', icon: Wallet,       color: 'text-rose-600' },
                { label: 'Iniciar Pomodoro', href: '/studies', icon: Clock,       color: 'text-violet-600' },
                { label: 'Ver Calendário', href: '/calendar', icon: Calendar,     color: 'text-blue-600' },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50
                             hover:bg-muted transition-colors text-center card-hover"
                >
                  <action.icon className={cn('w-5 h-5', action.color)} />
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-16 bg-muted rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-2xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 bg-muted rounded-2xl" />
          <div className="h-32 bg-muted rounded-2xl" />
        </div>
        <div className="space-y-6">
          <div className="h-40 bg-muted rounded-2xl" />
          <div className="h-40 bg-muted rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
