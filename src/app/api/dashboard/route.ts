import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, isAfter, addDays, parseISO } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const now         = new Date()
  const todayStart  = startOfDay(now)
  const todayEnd    = endOfDay(now)
  const monthStart  = startOfMonth(now)
  const monthEnd    = endOfMonth(now)
  const sevenDays   = addDays(now, 7)
  const todayStr    = now.toISOString().split('T')[0]

  const [tasks, habits, habitLogs, goals, accounts, monthTransactions, sessions, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          { dueDate:     { gte: todayStart, lte: todayEnd } },
          { scheduledAt: { gte: todayStart, lte: todayEnd } },
        ],
      },
      include: { subtasks: true },
      orderBy: { priority: 'asc' },
    }),

    prisma.habit.findMany({
      where: { userId: user.id, isActive: true },
    }),

    prisma.habitLog.findMany({
      where: {
        userId: user.id,
        date:   { gte: todayStart, lte: todayEnd },
      },
    }),

    prisma.goal.findMany({
      where:   { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take:    5,
    }),

    prisma.financialAccount.findMany({
      where: { userId: user.id, isActive: true, includeInNet: true },
    }),

    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } },
    }),

    prisma.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: todayStart, lte: todayEnd } },
    }),

    prisma.project.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
    }),
  ])

  // Today tasks
  const todayDone    = tasks.filter(t => t.status === 'DONE').length
  const todayOverdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length
  const nextTask     = tasks.find(t => t.status !== 'DONE') ?? null

  // Habits
  const habitsTotal = habits.length
  const habitsDone  = habitLogs.length

  // Finance
  const income  = monthTransactions.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0)
  const expense = monthTransactions.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0)
  const todayExpense = monthTransactions
    .filter(t => t.type === 'EXPENSE' && new Date(t.date) >= todayStart && new Date(t.date) <= todayEnd)
    .reduce((a, t) => a + t.amount, 0)

  const netWorth = accounts.reduce((a, acc) => a + acc.balance, 0)
  const savings  = income - expense

  // Upcoming bills
  const upcomingBills = await prisma.transaction.findMany({
    where: {
      userId:  user.id,
      isPaid:  false,
      dueDate: { gte: now, lte: sevenDays },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  // Study hours today
  const hoursStudied = sessions.reduce((a, s) => a + s.durationMin, 0)

  // Goals
  const goalsWithProgress = goals.map(g => ({
    ...g,
    progress: g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0,
  }))
  const dailyGoal    = goalsWithProgress[0] ?? null
  const financialGoal = goalsWithProgress.find(g => g.category === 'FINANCIAL') ?? null

  // Weather (optional — non-blocking)
  let weather = null
  try {
    const city    = process.env.NEXT_PUBLIC_WEATHER_CITY ?? 'São Paulo'
    const country = process.env.NEXT_PUBLIC_WEATHER_COUNTRY ?? 'BR'
    const apiKey  = process.env.OPENWEATHER_API_KEY

    if (apiKey) {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${apiKey}&units=metric&lang=pt_br`,
        { next: { revalidate: 1800 } }
      )
      if (res.ok) {
        const data = await res.json()
        weather = {
          city:        data.name,
          temp:        Math.round(data.main.temp),
          description: data.weather[0].description,
          icon:        data.weather[0].icon,
          humidity:    data.main.humidity,
          wind:        data.wind.speed,
        }
      }
    }
  } catch { /* weather is non-critical */ }

  const summary = {
    todayTasks: { total: tasks.length, done: todayDone, overdue: todayOverdue },
    nextTask: nextTask ? { ...nextTask, subtasks: nextTask.subtasks } : null,
    todayExpense,
    dailyGoal:    goalsWithProgress.find(g => g.category === 'PERSONAL') ?? null,
    hoursStudied,
    habitsToday:  { total: habitsTotal, done: habitsDone },
    upcomingBills,
    activeProjects: projects.length,
    monthBalance:   savings,
    netWorth,
    monthSavings:   savings > 0 ? savings : 0,
    financialGoal,
    weather,
  }

  return NextResponse.json({ data: summary })
}
