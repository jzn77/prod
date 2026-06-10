import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatRelative, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Priority, TransactionType } from '@/types'

// ─── CSS class merger ────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Formatação ───────────────────────────────────────────

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d))    return 'Hoje'
  if (isTomorrow(d)) return 'Amanhã'
  return formatRelative(d, new Date(), { locale: ptBR })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

// ─── Datas ───────────────────────────────────────────────

export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isPast(d) && !isToday(d)
}

export function getDayName(date: Date = new Date()): string {
  return format(date, 'EEEE', { locale: ptBR })
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ─── Cores de prioridade ──────────────────────────────────

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  URGENT: { label: 'Urgente', color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/30',    border: 'border-red-200' },
  HIGH:   { label: 'Alta',    color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200' },
  MEDIUM: { label: 'Média',   color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200' },
  LOW:    { label: 'Baixa',   color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30',  border: 'border-green-200' },
}

// ─── Cores de tipo de transação ───────────────────────────

export const TRANSACTION_CONFIG: Record<TransactionType, { label: string; color: string; sign: string }> = {
  INCOME:     { label: 'Receita',      color: 'text-emerald-600', sign: '+' },
  EXPENSE:    { label: 'Despesa',      color: 'text-red-600',     sign: '-' },
  TRANSFER:   { label: 'Transferência', color: 'text-blue-600',   sign: '↔' },
  INVESTMENT: { label: 'Investimento', color: 'text-purple-600',  sign: '↑' },
}

// ─── Cálculos de hábitos ──────────────────────────────────

export function calculateStreak(logs: { date: string }[]): number {
  if (!logs.length) return 0

  const sorted = [...logs]
    .map(l => format(parseISO(l.date), 'yyyy-MM-dd'))
    .sort()
    .reverse()

  let streak = 0
  let current = new Date()

  for (const logDate of sorted) {
    const expected = format(current, 'yyyy-MM-dd')
    if (logDate === expected) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

// ─── Misc ─────────────────────────────────────────────────

export function truncate(str: string, length = 50): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Dado um array, retorna a soma de um campo numérico */
export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((acc, item) => acc + Number(item[key] ?? 0), 0)
}

/** Agrupa um array por uma chave */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key])
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
