import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeService } from '@/services/api'
import type { Transaction, FinancialSummary } from '@/types'
import toast from 'react-hot-toast'

export function useFinanceSummary() {
  return useQuery<FinancialSummary>({
    queryKey: ['finance-summary'],
    queryFn:  () => financeService.summary(),
    staleTime: 30_000,
  })
}

export function useTransactions(params?: object) {
  const queryClient = useQueryClient()

  const query = useQuery<Transaction[]>({
    queryKey: ['transactions', params],
    queryFn:  () => financeService.transactions.list(params),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => financeService.transactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Lançamento adicionado!')
    },
    onError: () => toast.error('Erro ao adicionar lançamento'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeService.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] })
      toast.success('Lançamento removido')
    },
  })

  return {
    ...query,
    create: createMutation.mutateAsync,
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  }
}
