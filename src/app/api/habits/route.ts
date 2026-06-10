import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { subDays, startOfDay } from 'date-fns'

const createSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().optional(),
  icon:        z.string().optional(),
  color:       z.string().optional(),
  category:    z.string().optional(),
  frequency:   z.enum(['DAILY','WEEKLY','MONTHLY']).default('DAILY'),
  targetDays:  z.array(z.number().int().min(0).max(6)).default([0,1,2,3,4,5,6]),
  targetCount: z.number().int().positive().default(1),
  unit:        z.string().optional(),
})

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const includeLogs = searchParams.get('includeLogs') === 'true'

  const habits = await prisma.habit.findMany({
    where:   { userId: user.id },
    include: includeLogs ? {
      logs: {
        where:   { date: { gte: subDays(new Date(), 30) } },
        orderBy: { date: 'desc' },
      },
    } : undefined,
    orderBy: { position: 'asc' },
  })

  // Enrich with stats
  const enriched = habits.map(h => {
    const logs = (h as typeof h & { logs?: { date: Date }[] }).logs ?? []
    const last30 = logs.length
    const completionRate = (last30 / 30) * 100

    return { ...h, completionRate }
  })

  return NextResponse.json({ data: enriched })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const data = createSchema.parse(await req.json())
    const habit = await prisma.habit.create({ data: { ...data, userId: user.id } })
    return NextResponse.json({ data: habit }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
