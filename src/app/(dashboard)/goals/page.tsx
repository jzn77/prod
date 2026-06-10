'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Target, CheckCircle2, Clock, TrendingUp, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import { goalsService } from '@/services/api'
import { cn, formatDate, formatCurrency } from '@/utils/helpers'
import type { Goal, GoalCategory } from '@/types'
import toast from 'react-hot-toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  PERSONAL:     'Pessoal',
  FINANCIAL:    'Financeiro',
  HEALTH:       'Saúde',
  CAREER:       'Carreira',
  EDUCATION:    'Educação',
  RELATIONSHIP: 'Relacionamento',
  TRAVEL:       'Viagem',
  OTHER:        'Outro',
}

const CATEGORY_COLORS: Record<GoalCategory, { bg: string; text: string }> = {
  PERSONAL:     { bg: 'bg-violet-100 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-300' },
  FINANCIAL:    { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300' },
  HEALTH:       { bg: 'bg-rose-100 dark:bg-rose-950/50',    text: 'text-rose-700 dark:text-rose-300' },
  CAREER:       { bg: 'bg-blue-100 dark:bg-blue-950/50',    text: 'text-blue-700 dark:text-blue-300' },
  EDUCATION:    { bg: 'bg-amber-100 dark:bg-amber-950/50',  text: 'text-amber-700 dark:text-amber-300' },
  RELATIONSHIP: { bg: 'bg-pink-100 dark:bg-pink-950/50',    text: 'text-pink-700 dark:text-pink-300' },
  TRAVEL:       { bg: 'bg-sky-100 dark:bg-sky-950/50',      text: 'text-sky-700 dark:text-sky-300' },
  OTHER:        { bg: 'bg-slate-100 dark:bg-slate-950/50',  text: 'text-slate-700 dark:text-slate-300' },
}

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: (id: string) => void }) {
  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
  const catColor = CATEGORY_COLORS[goal.category]
  const isFinancial = goal.category === 'FINANCIAL'

  return (
    <div className="group bg-card rounded-2xl border border-border shadow-card p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
            {goal.icon ?? '🎯'}
          </div>
          <div>
            <h3 className="font-semibold">{goal.title}</h3>
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              catColor.bg, catColor.text,
            )}>
              {CATEGORY_LABELS[goal.category]}
            </span>
          </div>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="w-40 bg-popover border border-border rounded-xl shadow-card-hover p-1 z-50" align="end">
              <DropdownMenu.Item
                onSelect={() => onDelete(goal.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive cursor-pointer outline-none"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-semibold text-foreground">
            {isFinancial
              ? formatCurrency(goal.currentValue)
              : `${goal.currentValue} ${goal.unit ?? ''}`}
          </span>
          <span className="text-muted-foreground">
            {isFinancial
              ? formatCurrency(goal.targetValue)
              : `${goal.targetValue} ${goal.unit ?? ''}`}
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: goal.color ?? 'hsl(var(--primary))',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-semibold text-primary">{progress.toFixed(1)}%</span>
          {goal.dueDate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(goal.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Milestones */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="space-y-1.5 mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Etapas</p>
          {goal.milestones.slice(0, 3).map(m => (
            <div key={m.id} className="flex items-center gap-2">
              {m.isDone
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
              }
              <span className={cn('text-xs', m.isDone && 'line-through text-muted-foreground')}>
                {m.title}
              </span>
            </div>
          ))}
          {goal.milestones.length > 3 && (
            <p className="text-xs text-muted-foreground">+{goal.milestones.length - 3} mais</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function GoalsPage() {
  const queryClient = useQueryClient()

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn:  () => goalsService.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Meta removida')
    },
  })

  const stats = {
    total:     goals.length,
    active:    goals.filter(g => g.status === 'ACTIVE').length,
    completed: goals.filter(g => g.status === 'COMPLETED').length,
    avgProgress: goals.length
      ? goals.reduce((a, g) => a + g.progress, 0) / goals.length
      : 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {stats.active} ativas · {stats.completed} concluídas
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground
                           rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Metas ativas',   value: stats.active,                  icon: Target,      color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Concluídas',     value: stats.completed,               icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Progresso médio', value: `${stats.avgProgress.toFixed(0)}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border shadow-card p-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', s.bg)}>
              <s.icon className={cn('w-4.5 h-4.5', s.color)} />
            </div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20">
          <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma meta cadastrada</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={id => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
