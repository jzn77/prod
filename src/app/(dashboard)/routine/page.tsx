'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Filter, Search, LayoutList, LayoutGrid, Kanban,
  Calendar, Loader2, CheckCircle2, Circle, Clock, Tag,
  MoreHorizontal, Trash2, Edit, Star, StarOff,
} from 'lucide-react'
import { tasksService } from '@/services/api'
import { PRIORITY_CONFIG, cn, formatDate, formatRelativeDate, isOverdue } from '@/utils/helpers'
import type { Task, TaskStatus, Priority } from '@/types'
import toast from 'react-hot-toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

// ─── Types ────────────────────────────────────────────────

type ViewMode = 'list' | 'kanban' | 'calendar'

const STATUS_COLS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO',        label: 'A Fazer',     color: 'border-t-slate-400' },
  { id: 'IN_PROGRESS', label: 'Em Andamento', color: 'border-t-blue-500' },
  { id: 'DONE',        label: 'Concluído',   color: 'border-t-emerald-500' },
]

// ─── Task card ────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete, onFavorite }: {
  task:       Task
  onToggle:   (id: string, status: TaskStatus) => void
  onDelete:   (id: string) => void
  onFavorite: (id: string, fav: boolean) => void
}) {
  const p = PRIORITY_CONFIG[task.priority]
  const overdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'DONE'

  return (
    <div className={cn(
      'group bg-card rounded-xl border shadow-card p-4 transition-all duration-150',
      'hover:shadow-card-hover hover:-translate-y-0.5',
      task.status === 'DONE' && 'opacity-60',
      overdue && 'border-red-200 dark:border-red-900/50',
    )}>
      <div className="flex items-start gap-3">
        {/* Check */}
        <button
          onClick={() => onToggle(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')}
          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          {task.status === 'DONE'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            : <Circle className="w-5 h-5" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-sm',
            task.status === 'DONE' && 'line-through text-muted-foreground',
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
          )}

          <div className="flex items-center flex-wrap gap-2 mt-2">
            {/* Priority badge */}
            <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full', p.bg, p.color)}>
              {p.label}
            </span>

            {/* Due date */}
            {task.dueDate && (
              <span className={cn(
                'flex items-center gap-1 text-xs',
                overdue ? 'text-red-500' : 'text-muted-foreground',
              )}>
                <Clock className="w-3 h-3" />
                {formatRelativeDate(task.dueDate)}
              </span>
            )}

            {/* Tags */}
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}

            {/* Subtask progress */}
            {task.subtasks?.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtarefas
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onFavorite(task.id, !task.isFavorite)}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            {task.isFavorite
              ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              : <StarOff className="w-4 h-4 text-muted-foreground" />
            }
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-1 rounded hover:bg-muted transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="w-40 bg-popover border border-border rounded-xl shadow-card-hover p-1 z-50"
                align="end"
              >
                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted cursor-pointer outline-none">
                  <Edit className="w-4 h-4" /> Editar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => onDelete(task.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 text-destructive cursor-pointer outline-none"
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Subtask progress bar */}
      {task.subtasks?.length > 0 && (
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${(task.subtasks.filter(s => s.done).length / task.subtasks.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Kanban view ─────────────────────────────────────────

function KanbanView({ tasks, onToggle, onDelete, onFavorite }: {
  tasks:      Task[]
  onToggle:   (id: string, status: TaskStatus) => void
  onDelete:   (id: string) => void
  onFavorite: (id: string, fav: boolean) => void
}) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {STATUS_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        return (
          <div key={col.id} className={cn(
            'bg-muted/30 rounded-2xl p-4 border border-border border-t-4',
            col.color,
          )}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onFavorite={onFavorite} />
              ))}
              {colTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma tarefa aqui
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

export default function RoutinePage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('')

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn:  () => tasksService.list(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksService.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Erro ao atualizar tarefa'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Tarefa removida')
    },
  })

  const favMutation = useMutation({
    mutationFn: ({ id, fav }: { id: string; fav: boolean }) =>
      tasksService.update(id, { isFavorite: fav }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // Filter & search
  const filtered = tasks.filter(t => {
    const matchSearch   = !search || t.title.toLowerCase().includes(search.toLowerCase())
    const matchPriority = !filterPriority || t.priority === filterPriority
    const matchStatus   = !filterStatus   || t.status === filterStatus
    return matchSearch && matchPriority && matchStatus
  })

  const stats = {
    total:   tasks.length,
    done:    tasks.filter(t => t.status === 'DONE').length,
    overdue: tasks.filter(t => t.dueDate && isOverdue(t.dueDate) && t.status !== 'DONE').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rotina & Tarefas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {stats.done}/{stats.total} concluídas
            {stats.overdue > 0 && ` · ${stats.overdue} atrasada${stats.overdue > 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground
                           rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar tarefas…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filters */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as Priority | '')}
          className="px-3 py-2.5 rounded-xl border border-input bg-card text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Todas as prioridades</option>
          <option value="URGENT">Urgente</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Média</option>
          <option value="LOW">Baixa</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as TaskStatus | '')}
          className="px-3 py-2.5 rounded-xl border border-input bg-card text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Todos os status</option>
          <option value="TODO">A Fazer</option>
          <option value="IN_PROGRESS">Em Andamento</option>
          <option value="DONE">Concluído</option>
        </select>

        {/* View switcher */}
        <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
          {([
            { mode: 'list' as ViewMode,     Icon: LayoutList },
            { mode: 'kanban' as ViewMode,   Icon: Kanban },
          ]).map(({ mode, Icon }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                view === mode ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ListTodo className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Crie sua primeira tarefa com o botão acima
          </p>
        </div>
      ) : view === 'kanban' ? (
        <KanbanView
          tasks={filtered}
          onToggle={(id, status) => toggleMutation.mutate({ id, status })}
          onDelete={id => deleteMutation.mutate(id)}
          onFavorite={(id, fav) => favMutation.mutate({ id, fav })}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={(id, status) => toggleMutation.mutate({ id, status })}
              onDelete={id => deleteMutation.mutate(id)}
              onFavorite={(id, fav) => favMutation.mutate({ id, fav })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
