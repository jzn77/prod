'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Play, Pause, RotateCcw, BookOpen, Clock, Plus, Timer,
  CheckCircle2, Coffee, Loader2, BarChart3,
} from 'lucide-react'
import { studiesService } from '@/services/api'
import { cn, formatDuration } from '@/utils/helpers'
import type { Subject, StudySession } from '@/types'
import toast from 'react-hot-toast'
import * as Tabs from '@radix-ui/react-tabs'

// ─── Pomodoro Timer ───────────────────────────────────────

type PomodoroMode = 'work' | 'break' | 'longBreak'

const POMODORO_PRESETS = [
  { label: '25/5',       work: 25, break: 5,  longBreak: 15 },
  { label: '50/10',      work: 50, break: 10, longBreak: 20 },
  { label: 'Custom',     work: 30, break: 5,  longBreak: 15 },
]

function PomodoroTimer() {
  const [preset, setPreset] = useState(0)
  const [mode, setMode] = useState<PomodoroMode>('work')
  const [seconds, setSeconds] = useState(POMODORO_PRESETS[0].work * 60)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const current = POMODORO_PRESETS[preset]

  useEffect(() => {
    const totalSeconds = mode === 'work'
      ? current.work * 60
      : mode === 'break'
      ? current.break * 60
      : current.longBreak * 60
    setSeconds(totalSeconds)
    setRunning(false)
  }, [preset, mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false)
            if (mode === 'work') {
              const newCycles = cycles + 1
              setCycles(newCycles)
              toast.success(newCycles % 4 === 0 ? '4 ciclos! Pausa longa 🎉' : 'Ciclo concluído! Hora de descansar.')
              setMode(newCycles % 4 === 0 ? 'longBreak' : 'break')
            } else {
              toast.success('Descansou! Hora de focar.')
              setMode('work')
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, cycles])

  const totalSeconds = mode === 'work'
    ? current.work * 60
    : mode === 'break'
    ? current.break * 60
    : current.longBreak * 60

  const progress = ((totalSeconds - seconds) / totalSeconds) * 100
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')

  const radius   = 80
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference - (progress / 100) * circumference

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          Pomodoro
        </h3>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {POMODORO_PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPreset(i)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                preset === i ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        {(['work', 'break', 'longBreak'] as PomodoroMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1',
              mode === m
                ? m === 'work' ? 'bg-primary text-primary-foreground' : 'bg-emerald-500 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'work' ? 'Foco' : m === 'break' ? 'Pausa' : 'Pausa Longa'}
          </button>
        ))}
      </div>

      {/* SVG circular timer */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <svg width="200" height="200" className="-rotate-90">
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke={mode === 'work' ? 'hsl(var(--primary))' : '#10b981'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-mono">{mins}:{secs}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {mode === 'work' ? 'Focando' : 'Descansando'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const total = mode === 'work' ? current.work * 60 : mode === 'break' ? current.break * 60 : current.longBreak * 60
              setSeconds(total)
              setRunning(false)
            }}
            className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRunning(r => !r)}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center transition-all',
              'shadow-glow font-medium',
              running ? 'bg-muted hover:bg-muted/80' : 'bg-primary hover:bg-primary/90 text-primary-foreground',
            )}
          >
            {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div className="p-3 rounded-full bg-muted flex items-center justify-center min-w-[48px]">
            <span className="text-sm font-semibold">{cycles}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{cycles} ciclos completados hoje</p>
      </div>
    </div>
  )
}

// ─── Subject card ─────────────────────────────────────────

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-4 card-hover">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: subject.color ? `${subject.color}20` : undefined }}
        >
          {subject.icon ?? '📚'}
        </div>
        <div>
          <h3 className="font-medium text-sm">{subject.name}</h3>
          <p className="text-xs text-muted-foreground">{subject.weeklyHours}h/semana</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        {formatDuration(subject.totalHours ? subject.totalHours * 60 : 0)} no total
      </div>
    </div>
  )
}

// ─── Session row ──────────────────────────────────────────

function SessionRow({ session }: { session: StudySession }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
        <BookOpen className="w-4 h-4 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{session.title ?? session.subject?.name ?? 'Sessão de estudos'}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(session.startedAt).toLocaleDateString('pt-BR')} ·
          {session.subject?.name}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        {formatDuration(session.durationMin)}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

export default function StudiesPage() {
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn:  () => studiesService.subjects.list(),
  })

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<StudySession[]>({
    queryKey: ['study-sessions'],
    queryFn:  () => studiesService.sessions.list({ limit: 20 }),
  })

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMin, 0)
  const todaySessions = sessions.filter(s =>
    new Date(s.startedAt).toDateString() === new Date().toDateString()
  )
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMin, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estudos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {formatDuration(todayMinutes)} hoje · {formatDuration(totalMinutes)} no total
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground
                           rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Disciplina
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hoje',       value: formatDuration(todayMinutes),      icon: Clock,     color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Esta semana', value: formatDuration(totalMinutes),     icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40' },
          { label: 'Disciplinas', value: subjects.length.toString(),       icon: BookOpen,  color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left col — Pomodoro + subjects */}
        <div className="lg:col-span-1 space-y-6">
          <PomodoroTimer />

          {/* Subjects */}
          <div>
            <h2 className="font-semibold mb-3">Disciplinas</h2>
            {loadingSubjects ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map(s => <SubjectCard key={s.id} subject={s} />)}
                {subjects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Adicione disciplinas para rastrear seu progresso
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 cols — sessions */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl border border-border shadow-card">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Histórico de Sessões</h2>
            </div>
            <div className="p-5">
              {loadingSessions ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Nenhuma sessão registrada ainda.
                  <br />Inicie o Pomodoro para começar!
                </div>
              ) : (
                sessions.map(s => <SessionRow key={s.id} session={s} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
