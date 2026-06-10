'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Loader2,
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, addMonths, subMonths, getDay, parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { calendarService } from '@/services/api'
import { cn } from '@/utils/helpers'
import type { CalendarEvent } from '@/types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const EVENT_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e',
  '#f59e0b','#10b981','#3b82f6','#06b6d4',
]

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', format(currentMonth, 'yyyy-MM')],
    queryFn:  () => calendarService.events.list({
      from: monthStart.toISOString(),
      to:   monthEnd.toISOString(),
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarService.events.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events'] }),
  })

  // Calendar grid days
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart) // 0-6
  const paddingDays  = Array.from({ length: startPadding }, (_, i) => i)

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(parseISO(e.startAt), day))

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-muted-foreground text-sm mt-0.5 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground
                           rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Padding cells */}
              {paddingDays.map(i => (
                <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-border/50" />
              ))}

              {/* Day cells */}
              {days.map(day => {
                const dayEvents = getEventsForDay(day)
                const selected  = selectedDay && isSameDay(day, selectedDay)

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'min-h-[80px] p-1.5 border-b border-r border-border/50',
                      'cursor-pointer hover:bg-muted/30 transition-colors',
                      selected && 'bg-primary/5',
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-sm mb-1',
                      isToday(day) && 'bg-primary text-primary-foreground font-bold',
                      selected && !isToday(day) && 'bg-primary/20 text-primary font-medium',
                      !isSameMonth(day, currentMonth) && 'text-muted-foreground',
                    )}>
                      {format(day, 'd')}
                    </span>

                    {/* Events */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => (
                        <div
                          key={e.id}
                          className="text-2xs px-1.5 py-0.5 rounded truncate text-white font-medium"
                          style={{ background: e.color ?? EVENT_COLORS[0] }}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-2xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} mais
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Day detail */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <h3 className="font-semibold mb-4">
            {selectedDay
              ? format(selectedDay, "d 'de' MMMM", { locale: ptBR })
              : 'Selecione um dia'}
          </h3>

          {selectedDayEvents.length === 0 ? (
            <div className="text-center py-10">
              <CalendarIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum evento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map(e => (
                <div
                  key={e.id}
                  className="p-3 rounded-xl border border-border"
                  style={{ borderLeftColor: e.color ?? EVENT_COLORS[0], borderLeftWidth: 3 }}
                >
                  <p className="font-medium text-sm">{e.title}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {e.allDay
                      ? 'Dia inteiro'
                      : `${format(parseISO(e.startAt), 'HH:mm')} – ${format(parseISO(e.endAt), 'HH:mm')}`
                    }
                  </div>
                  {e.location && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {e.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
