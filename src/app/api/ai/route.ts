import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

const schema = z.object({
  message: z.string().min(1).max(2000),
  context: z.string().optional(),
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function getUserContext(userId: string): Promise<string> {
  const now   = new Date()
  const month = { gte: startOfMonth(now), lte: endOfMonth(now) }
  const week  = { gte: startOfWeek(now),  lte: endOfWeek(now) }

  const [tasks, habits, goals, transactions, sessions, subscriptions] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      select: { title: true, status: true, priority: true, dueDate: true },
      take: 30,
      orderBy: { dueDate: 'asc' },
    }),
    prisma.habit.findMany({
      where:   { userId, isActive: true },
      include: { logs: { where: { date: { gte: startOfWeek(now) } } } },
      take:    20,
    }),
    prisma.goal.findMany({
      where:  { userId, status: 'ACTIVE' },
      select: { title: true, category: true, currentValue: true, targetValue: true, dueDate: true },
      take:   10,
    }),
    prisma.transaction.findMany({
      where:   { userId, date: month },
      include: { category: { select: { name: true } } },
      take:    100,
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: week },
      select: { durationMin: true, startedAt: true },
    }),
    prisma.subscription.findMany({
      where:  { userId, isActive: true },
      select: { name: true, amount: true, billingCycle: true },
    }),
  ])

  // Compute financials
  const income  = transactions.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0)
  const balance = income - expense

  const expenseByCategory = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const cat = t.category?.name ?? 'Outros'
      acc[cat] = (acc[cat] ?? 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const overdueTasks = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
  )

  const studyHoursWeek = sessions.reduce((a, s) => a + s.durationMin, 0) / 60

  return `
# Dados do Usuário — ${now.toLocaleDateString('pt-BR')}

## Tarefas
- Total: ${tasks.length} | Concluídas: ${tasks.filter(t => t.status === 'DONE').length} | Atrasadas: ${overdueTasks.length}
- Atrasadas: ${overdueTasks.map(t => `"${t.title}" (prioridade: ${t.priority})`).join(', ') || 'Nenhuma'}
- Urgentes: ${tasks.filter(t => t.priority === 'URGENT' && t.status !== 'DONE').map(t => t.title).join(', ') || 'Nenhuma'}

## Finanças (mês atual)
- Receitas: R$ ${income.toFixed(2)}
- Despesas: R$ ${expense.toFixed(2)}
- Saldo: R$ ${balance.toFixed(2)}
- Assinaturas: ${subscriptions.length} ativas (R$ ${subscriptions.reduce((a, s) => a + s.amount, 0).toFixed(2)}/mês)
- Por categoria: ${Object.entries(expenseByCategory).map(([k, v]) => `${k}: R$ ${v.toFixed(2)}`).join(', ')}

## Hábitos
${habits.map(h => `- ${h.name}: ${h.logs.length} dias esta semana`).join('\n') || '- Nenhum cadastrado'}

## Metas Ativas
${goals.map(g => `- "${g.title}": ${((g.currentValue / g.targetValue) * 100).toFixed(0)}% concluído`).join('\n') || '- Nenhuma'}

## Estudos (esta semana)
- Tempo total: ${studyHoursWeek.toFixed(1)} horas
`.trim()
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { message, context } = schema.parse(await req.json())

    const userContext = await getUserContext(user.id)

    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      max_tokens:  800,
      temperature: 0.7,
      messages: [
        {
          role:    'system',
          content: `Você é o assistente pessoal inteligente de ${user.name}, integrado ao Personal Hub.
Você tem acesso aos dados reais do usuário (tarefas, finanças, hábitos, metas, estudos).
Responda em português brasileiro, seja direto, útil e empático.
Use os dados abaixo para dar respostas personalizadas e acionáveis.
Quando sugerir melhorias, seja específico e prático.
Se não souber algo, diga que não tem essa informação disponível.

${userContext}`,
        },
        {
          role:    'user',
          content: message,
        },
      ],
    })

    const reply = completion.choices[0]?.message?.content ?? 'Não consegui gerar uma resposta.'

    // Save chat to DB
    await prisma.aiChat.upsert({
      where:  { id: `${user.id}-latest` },
      create: {
        id:       `${user.id}-latest`,
        userId:   user.id,
        context,
        messages: [
          { role: 'user',      content: message, createdAt: new Date().toISOString() },
          { role: 'assistant', content: reply,   createdAt: new Date().toISOString() },
        ],
      },
      update: {
        messages: {
          push: [
            { role: 'user',      content: message, createdAt: new Date().toISOString() },
            { role: 'assistant', content: reply,   createdAt: new Date().toISOString() },
          ],
        } as never,
      },
    }).catch(() => {/* non-critical */})

    return NextResponse.json({ data: { reply } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('[POST /api/ai]', err)
    return NextResponse.json({ error: 'Erro ao processar sua pergunta' }, { status: 500 })
  }
}
