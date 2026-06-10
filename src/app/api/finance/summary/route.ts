import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const now = new Date()

  // Current month transactions
  const [monthTx, accounts, subscriptions, upcomingBills] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date:   { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
      include: { category: { select: { name: true } } },
    }),

    prisma.financialAccount.findMany({
      where: { userId: user.id, isActive: true, includeInNet: true },
    }),

    prisma.subscription.findMany({
      where: { userId: user.id, isActive: true },
    }),

    prisma.transaction.findMany({
      where: {
        userId:  user.id,
        isPaid:  false,
        dueDate: { gte: now },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
  ])

  const income  = monthTx.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0)
  const expense = monthTx.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0)
  const balance = income - expense
  const netWorth = accounts.reduce((a, acc) => a + acc.balance, 0)
  const savings = Math.max(0, balance)
  const savingsRate = income > 0 ? (savings / income) * 100 : 0

  // Expense by category
  const catMap: Record<string, number> = {}
  monthTx.filter(t => t.type === 'EXPENSE').forEach(t => {
    const cat = t.category?.name ?? 'Outros'
    catMap[cat] = (catMap[cat] ?? 0) + t.amount
  })
  const expenseByCategory = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: expense > 0 ? (amount / expense) * 100 : 0,
    }))

  // Monthly trend (last 6 months)
  const monthlyTrend = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      return prisma.transaction.findMany({
        where: {
          userId: user.id,
          date:   { gte: startOfMonth(d), lte: endOfMonth(d) },
        },
      }).then(txs => ({
        month:   format(d, 'MMM', { locale: ptBR }),
        income:  txs.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0),
        expense: txs.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0),
      }))
    })
  )

  const subscriptionTotal = subscriptions.reduce((a, s) => {
    const monthly = s.billingCycle === 'ANNUAL'     ? s.amount / 12
                  : s.billingCycle === 'SEMIANNUAL'  ? s.amount / 6
                  : s.billingCycle === 'QUARTERLY'   ? s.amount / 3
                  : s.billingCycle === 'WEEKLY'      ? s.amount * 4.33
                  : s.amount
    return a + monthly
  }, 0)

  return NextResponse.json({
    data: {
      totalIncome:  income,
      totalExpense: expense,
      balance,
      netWorth,
      savings,
      savingsRate,
      expenseByCategory,
      monthlyTrend,
      upcomingBills,
      subscriptionTotal,
    },
  })
}
