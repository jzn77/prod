'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard,
  ArrowUpRight, ArrowDownRight, Filter, Search, Loader2, DollarSign,
  MoreHorizontal, Trash2, Bell,
} from 'lucide-react'
import { financeService } from '@/services/api'
import { formatCurrency, cn, formatDate, TRANSACTION_CONFIG } from '@/utils/helpers'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts'
import type { FinancialSummary, Transaction, TransactionType } from '@/types'
import toast from 'react-hot-toast'
import * as Tabs from '@radix-ui/react-tabs'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

// ─── Summary cards ────────────────────────────────────────

function FinanceSummaryCards({ summary }: { summary: FinancialSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          label:   'Saldo do Mês',
          value:   summary.balance,
          icon:    DollarSign,
          color:   summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600',
          bg:      summary.balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40',
          format:  true,
        },
        {
          label:   'Receitas',
          value:   summary.totalIncome,
          icon:    TrendingUp,
          color:   'text-emerald-600',
          bg:      'bg-emerald-50 dark:bg-emerald-950/40',
          format:  true,
        },
        {
          label:   'Despesas',
          value:   summary.totalExpense,
          icon:    TrendingDown,
          color:   'text-red-600',
          bg:      'bg-red-50 dark:bg-red-950/40',
          format:  true,
        },
        {
          label:   'Economias',
          value:   `${summary.savingsRate.toFixed(0)}%`,
          icon:    PiggyBank,
          color:   'text-blue-600',
          bg:      'bg-blue-50 dark:bg-blue-950/40',
          format:  false,
        },
      ].map(card => (
        <div key={card.label} className="bg-card rounded-2xl border border-border shadow-card p-5">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', card.bg)}>
            <card.icon className={cn('w-5 h-5', card.color)} />
          </div>
          <p className={cn('text-2xl font-bold', card.color)}>
            {card.format ? formatCurrency(card.value as number) : card.value}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Transaction row ──────────────────────────────────────

function TransactionRow({ tx, onDelete }: { tx: Transaction; onDelete: (id: string) => void }) {
  const cfg = TRANSACTION_CONFIG[tx.type]

  return (
    <div className="group flex items-center gap-4 py-3 border-b border-border last:border-0">
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm',
        tx.type === 'INCOME'     && 'bg-emerald-100 dark:bg-emerald-950/50',
        tx.type === 'EXPENSE'    && 'bg-red-100 dark:bg-red-950/50',
        tx.type === 'INVESTMENT' && 'bg-purple-100 dark:bg-purple-950/50',
        tx.type === 'TRANSFER'   && 'bg-blue-100 dark:bg-blue-950/50',
      )}>
        {tx.category?.icon ?? (tx.type === 'INCOME' ? '↑' : tx.type === 'EXPENSE' ? '↓' : '→')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tx.title}</p>
        <p className="text-xs text-muted-foreground">
          {tx.category?.name ?? cfg.label} · {formatDate(tx.date)}
        </p>
      </div>

      {/* Amount */}
      <p className={cn('font-semibold text-sm', cfg.color)}>
        {cfg.sign}{formatCurrency(tx.amount)}
      </p>

      {/* Delete */}
      <button
        onClick={() => onDelete(tx.id)}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity
                   hover:bg-destructive/10 text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Category pie chart ───────────────────────────────────

const PIE_COLORS = ['#6366f1','#8b5cf6','#a78bfa','#ec4899','#f43f5e','#fb923c','#fbbf24','#34d399']

function CategoryChart({ data }: { data: { category: string; amount: number; percentage: number }[] }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <h3 className="font-semibold mb-4">Despesas por Categoria</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="amount" nameKey="category">
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [formatCurrency(v), 'Valor']}
            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Monthly chart ────────────────────────────────────────

function MonthlyChart({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <h3 className="font-semibold mb-4">Fluxo de Caixa Mensal</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v: number) => formatCurrency(v)}
            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
          />
          <Area type="monotone" dataKey="income"  stroke="#10b981" fill="url(#incomeGrad)"  name="Receitas" strokeWidth={2} />
          <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" name="Despesas" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

export default function FinancePage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('overview')
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('')

  const { data: summary, isLoading: loadingSummary } = useQuery<FinancialSummary>({
    queryKey: ['finance-summary'],
    queryFn:  () => financeService.summary(),
  })

  const { data: transactions = [], isLoading: loadingTx } = useQuery<Transaction[]>({
    queryKey: ['transactions', typeFilter],
    queryFn:  () => financeService.transactions.list({ type: typeFilter || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeService.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] })
      toast.success('Lançamento removido')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finanças</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Controle completo da sua vida financeira
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground
                           rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </div>

      {/* Summary cards */}
      {summary && <FinanceSummaryCards summary={summary} />}

      {/* Tabs */}
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
          {[
            { value: 'overview',      label: 'Visão Geral' },
            { value: 'transactions',  label: 'Lançamentos' },
            { value: 'subscriptions', label: 'Assinaturas' },
          ].map(t => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                'data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground',
                'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Overview tab */}
        <Tabs.Content value="overview" className="mt-6">
          {loadingSummary ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : summary ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <MonthlyChart data={summary.monthlyTrend} />
              <CategoryChart data={summary.expenseByCategory} />

              {/* Net worth & upcoming */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <h3 className="font-semibold mb-4">Patrimônio Líquido</h3>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(summary.netWorth)}</p>
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Assinaturas/mês</span>
                    <span className="font-medium">{formatCurrency(summary.subscriptionTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de poupança</span>
                    <span className="font-medium text-emerald-600">{summary.savingsRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Upcoming bills */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  Próximos Vencimentos
                </h3>
                {summary.upcomingBills.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum vencimento próximo</p>
                ) : (
                  <div className="space-y-0">
                    {summary.upcomingBills.slice(0, 5).map(bill => (
                      <div key={bill.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium">{bill.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {bill.dueDate ? formatDate(bill.dueDate) : '—'}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(bill.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </Tabs.Content>

        {/* Transactions tab */}
        <Tabs.Content value="transactions" className="mt-6">
          <div className="bg-card rounded-2xl border border-border shadow-card">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Pesquisar lançamentos…"
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as TransactionType | '')}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Todos</option>
                <option value="INCOME">Receitas</option>
                <option value="EXPENSE">Despesas</option>
                <option value="INVESTMENT">Investimentos</option>
              </select>
            </div>

            <div className="p-4">
              {loadingTx ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Nenhum lançamento encontrado
                </div>
              ) : (
                <div>
                  {transactions.map(tx => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      onDelete={id => deleteMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>

        {/* Subscriptions tab */}
        <Tabs.Content value="subscriptions" className="mt-6">
          <div className="text-center py-20">
            <CreditCard className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Gerencie suas assinaturas</p>
            <button className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground
                               rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors mx-auto">
              <Plus className="w-4 h-4" /> Adicionar Assinatura
            </button>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
