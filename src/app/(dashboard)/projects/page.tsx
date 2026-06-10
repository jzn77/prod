'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FolderKanban, CheckCircle2, Clock, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import { projectsService } from '@/services/api'
import { cn, formatDate } from '@/utils/helpers'
import type { Project, ProjectStatus } from '@/types'
import toast from 'react-hot-toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Ativo',     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/40' },
  COMPLETED: { label: 'Concluído', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  PAUSED:    { label: 'Pausado',   color: 'text-yellow-600',  bg: 'bg-yellow-50 dark:bg-yellow-950/40' },
  ARCHIVED:  { label: 'Arquivado', color: 'text-muted-foreground', bg: 'bg-muted' },
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const status = STATUS_CONFIG[project.status]

  return (
    <div className="group bg-card rounded-2xl border border-border shadow-card p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: project.color ? `${project.color}20` : undefined }}
          >
            {project.icon ?? '📁'}
          </div>
          <div>
            <h3 className="font-semibold">{project.name}</h3>
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              status.bg, status.color,
            )}>
              {status.label}
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
                onSelect={() => onDelete(project.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive cursor-pointer outline-none"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progresso</span>
          <span>{project.progress.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${project.progress}%`,
              background: project.color ?? 'hsl(var(--primary))',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
        {project.dueDate ? (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(project.dueDate)}
          </span>
        ) : <span />}
        {project.tasks && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {project.tasks.filter(t => t.status === 'DONE').length}/{project.tasks.length} tarefas
          </span>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const queryClient = useQueryClient()

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn:  () => projectsService.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto removido')
    },
  })

  const active    = projects.filter(p => p.status === 'ACTIVE').length
  const completed = projects.filter(p => p.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {active} ativos · {completed} concluídos
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground
                           rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum projeto cadastrado</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onDelete={id => deleteMutation.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  )
}
