import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const createSchema = z.object({
  title:            z.string().min(1).max(500),
  description:      z.string().optional(),
  category:         z.string().optional(),
  priority:         z.enum(['URGENT','HIGH','MEDIUM','LOW']).default('MEDIUM'),
  status:           z.enum(['TODO','IN_PROGRESS','DONE','CANCELLED','ARCHIVED']).default('TODO'),
  dueDate:          z.string().datetime().optional(),
  scheduledAt:      z.string().datetime().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  recurrence:       z.enum(['NONE','DAILY','WEEKLY','BIWEEKLY','MONTHLY','YEARLY','CUSTOM']).default('NONE'),
  color:            z.string().optional(),
  icon:             z.string().optional(),
  tags:             z.array(z.string()).default([]),
  isFavorite:       z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search   = searchParams.get('search')

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      ...(status   && { status:   status as never }),
      ...(priority && { priority: priority as never }),
      ...(search   && { title:    { contains: search, mode: 'insensitive' } }),
    },
    include: {
      subtasks: { orderBy: { position: 'asc' } },
      attachments: true,
    },
    orderBy: [
      { priority: 'asc' }, // URGENT < HIGH < MEDIUM < LOW (alphabetically)
      { dueDate:  'asc' },
      { position: 'asc' },
    ],
  })

  return NextResponse.json({ data: tasks })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const task = await prisma.task.create({
      data: { ...data, userId: user.id },
      include: { subtasks: true },
    })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
