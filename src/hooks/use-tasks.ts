import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksService } from '@/services/api'
import type { Task, TaskStatus, Priority } from '@/types'
import toast from 'react-hot-toast'

interface UseTasksOptions {
  status?:   TaskStatus
  priority?: Priority
  search?:   string
}

export function useTasks(options: UseTasksOptions = {}) {
  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks', options],
    queryFn:  () => tasksService.list(options),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Task>) => tasksService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Tarefa criada!')
      return res
    },
    onError: () => toast.error('Erro ao criar tarefa'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      tasksService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const prev = queryClient.getQueryData<Task[]>(['tasks', options])
      queryClient.setQueryData<Task[]>(['tasks', options], old =>
        old?.map(t => t.id === id ? { ...t, ...data } : t) ?? []
      )
      return { prev }
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['tasks', options], ctx?.prev)
      toast.error('Erro ao atualizar tarefa')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Tarefa removida')
    },
  })

  return {
    tasks,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}
