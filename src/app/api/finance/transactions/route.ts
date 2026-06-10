import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { startOfMonth, endOfMonth } from 'date-fns'

const createSchema = z.object({
  title:         z.string().min(1).max(500),
  description:   z.string().optional(),
  amount:        z.number().positive(),
  type:          z.enum(['INCOME','EXPENSE','TRANSFER','INVESTMENT']),
  date:          z.string().datetime(),
  accountId:     z.string().cuid(),
  categoryId:    z.string().cuid().optional(),
  paymentMethod: z.enum(['MONEY','DEBIT_CARD','CREDIT_CARD','PIX','TRANSFER','BOLETO','OTHER']).default('PIX'),
  isRecurring:   z.boolean().default(false),
  recurrence:    z.enum(['NONE','DAILY','WEEKLY','BIWEEKLY','MONTHLY','YEARLY','CUSTOM']).default('NONE'),
  isInstallment: z.boolean().default(false),
  installmentNumber: z.number().int().optional(),
  installmentTotal:  z.number().int().optional(),
  tags:          z.array(z.string()).default([]),
  isPaid:        z.boolean().default(true),
  dueDate:       z.string().datetime().optional(),
})

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type    = searchParams.get('type')
  const monthStr = searchParams.get('month') // YYYY-MM

  let dateFilter = {}
  if (monthStr) {
    const [year, month] = monthStr.split('-').map(Number)
    const d = new Date(year, month - 1)
    dateFilter = { gte: startOfMonth(d), lte: endOfMonth(d) }
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(type && { type: type as never }),
      ...(monthStr && { date: dateFilter }),
    },
    include: {
      category: { select: { name: true, icon: true, color: true } },
      account:  { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: 200,
  })

  return NextResponse.json({ data: transactions })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const data = createSchema.parse(await req.json())

    // Verify account belongs to user
    const account = await prisma.financialAccount.findFirst({
      where: { id: data.accountId, userId: user.id },
    })
    if (!account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })

    const tx = await prisma.transaction.create({
      data: { ...data, userId: user.id, date: new Date(data.date) },
      include: { category: true, account: true },
    })

    // Update account balance
    const delta = data.type === 'INCOME' ? data.amount : -data.amount
    if (data.type !== 'TRANSFER') {
      await prisma.financialAccount.update({
        where: { id: data.accountId },
        data:  { balance: { increment: delta } },
      })
    }

    return NextResponse.json({ data: tx }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
