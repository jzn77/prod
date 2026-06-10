'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Flame, TrendingUp, CheckCircle2, Circle, MoreHorizontal,
  Trash2, Edit, Calendar, Target, Loader2,
} from 'lucide-react'
import { habitsService } from '@/services/api'
import { cn, calculateStreak } from '@/utils/helpers'
import { format, subDays, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Habit } from '@/types'
import toast from 'react-hot-toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

// ─── Mini calendar (last 7 days) ─────────────────────────

function WeekCalendar({ logs }: { logs: { date: string }[] }) {
  const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i))

  return (
    <div className="flex gap-1 mt-3">
      {days.map(day => {
        const logged = logs.some(l => isSameDay(parseISO(l.date), day))
        const isToday = isSameDay(day, new Date())

        return (
          <div key={day.toISOString()} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-2xs text-muted-foreground">
              {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
            </span>
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all',
              logged    ? 'bg-primary text-primary-foreground' : 'bg-muted',
              isToday && !logged && 'ring-2 ring-primary ring-offset-1',
            )}>
              {logged && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Habit Card ───────────────────────────────────────────

function HabitCard({ habit, onLog, onUnlog, onDelete }: {
  habit:   Habit
  onLog:   (id: string) => void
  onUnlog: (id: string) => void
  onDelete:(id: string) => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLog = habit.logs?.find(l =>
    format(parseISO(l.date), 'yyyy-MM-dd') === today
  )
  const streak = calculateStreak(habit.logs ?? [])
  const isDone = !!todayLog

  return (
    <div className={cn(
      'group bg-card rounded-2xl border shadow-card p-5 transition-all duration-150',
      'hover:shadow-card-hover',
      isDone && 'border-emerald-200/70 dark:border-emerald-900/50',
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Icon or emoji */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: habit.color ? `${habit.color}20` : undefined }}
          >
            {habit.icon ?? '✨'}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{habit.name}</h3>
            {habit.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Check button */}
          <button
            onClick={() => isDone ? onUnlog(habit.id) : onLog(habit.id)}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
              isDone
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-muted hover:bg-primary hover:text-primary-foreground',
            )}
          >
            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="w-40 bg-popover border border-border rounded-xl shadow-card-hover p-1 z-50"
                align="end"
              >
                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted cursor-pointer outline-none">
                  <Edit className="w-4 h-4" /> Editar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => onDelete(habit.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive cursor-pointer outline-none"
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flame className={cn('w-3.5 h-3.5', streak > 0 ? 'text-orange-500' : '')} />
          <span className={cn('font-medium', streak > 0 ? 'text-orange-600' : '')}>
            {streak} dias seguidos
          </span>
        </div>
        {habit.completionRate != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span>{habit.completionRate.toFixed(0)}% este mês</span>
          </div>
        )}
      </div>

      {/* Week mini-calendar */}
      <WeekCalendar logs={habit.logs ?? []} />
    </div>
  )
}

// ─── Stats overview ───────────────────────────────────────

function HabitsStats({ habits }: { habits: Habit[] }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const doneTodayCount = habits.filter(h =>
    h.logs?.some(l => format(parseISO(l.date), 'yyyy-MM-dd') === today)
  ).length

  const bestStreak = Math.max(0, ...habits.map(h => calculateStreak(h.logs ?? [])))
  const avgCompletion = habits.length
    ? habits.reduce((acc, h) => acc + (h.completionRate ?? 0), 0) / habits.length
    : 0

  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Feitos hoje',     value: `${doneTodayCount}/${habits.length}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
        { label: 'Maior sequência', value: `${bestStreak} dias`,                icon: Flame,         color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40' },
        { label: 'Taxa de sucesso', value: `${avgCompletion.toFixed(0)}%`,       icon: TrendingUp,    color: 'text-primary',   bg: 'bg-primary/10' },
      ].map(stat => (
        <div key={stat.label} className="bg-card rounded-2xl border border-border shadow-card p-4">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
            <stat.icon className={cn('w-4.5 h-4.5', stat.color)} />
          </div>
          <p className="text-xl font-bold">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

export default function HabitsPage() {
  const queryClient = useQueryClient()

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn:  () => habitsService.list({ includeLogs: true }),
  })

  const logMutation = useMutation({
    mutationFn: (id: string) => habitsService.logToday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Hábito registrado! 🔥')
    },
  })

  const unlogMutation = useMutation({
    mutationFn: (id: string) => habitsService.unlog(id, format(new Date(), 'yyyy-MM-dd')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => habitsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Hábito removido')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hábitos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground
                           rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Hábito
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-20">
          <Flame className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum hábito cadastrado</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Crie seu primeiro hábito acima</p>
        </div>
      ) : (
        <>
          <HabitsStats habits={habits} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onLog={id => logMutation.mutate(id)}
                onUnlog={id => unlogMutation.mutate(id)}
                onDelete={id => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
