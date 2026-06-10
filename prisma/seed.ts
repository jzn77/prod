import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database…')

  // Demo user
  const passwordHash = await bcrypt.hash('senha123', 12)

  const user = await prisma.user.upsert({
    where:  { email: 'joao@exemplo.com' },
    update: {},
    create: {
      name:  'João Silva',
      email: 'joao@exemplo.com',
      passwordHash,
      settings: { create: {} },
    },
  })

  console.log(`✅ Usuário criado: ${user.email}`)

  // Financial account
  const account = await prisma.financialAccount.upsert({
    where:  { id: 'demo-account' },
    update: {},
    create: {
      id:      'demo-account',
      userId:  user.id,
      name:    'Conta Corrente',
      type:    'CHECKING',
      balance: 5000,
    },
  })

  // Demo habits
  const habits = [
    { name: 'Beber água',  icon: '💧', color: '#3b82f6', category: 'Saúde' },
    { name: 'Academia',    icon: '🏋️',  color: '#ef4444', category: 'Saúde' },
    { name: 'Leitura',     icon: '📚', color: '#f59e0b', category: 'Educação' },
    { name: 'Meditação',   icon: '🧘', color: '#8b5cf6', category: 'Bem-estar' },
    { name: 'Estudar',     icon: '💻', color: '#6366f1', category: 'Educação' },
  ]

  for (const h of habits) {
    await prisma.habit.upsert({
      where:  { id: `demo-habit-${h.name}` },
      update: {},
      create: { id: `demo-habit-${h.name}`, userId: user.id, ...h },
    })
  }
  console.log(`✅ ${habits.length} hábitos criados`)

  // Demo tasks
  const tasks = [
    { title: 'Revisar relatório mensal',    priority: 'HIGH' as const,   status: 'TODO' as const },
    { title: 'Responder e-mails urgentes',  priority: 'URGENT' as const, status: 'IN_PROGRESS' as const },
    { title: 'Reunião com cliente',         priority: 'HIGH' as const,   status: 'TODO' as const },
    { title: 'Atualizar currículo',         priority: 'MEDIUM' as const, status: 'TODO' as const },
    { title: 'Comprar mantimentos',         priority: 'LOW' as const,    status: 'DONE' as const },
  ]

  for (const t of tasks) {
    await prisma.task.create({
      data: { userId: user.id, ...t },
    }).catch(() => {/* ignore duplicates */})
  }
  console.log(`✅ ${tasks.length} tarefas criadas`)

  // Demo goal
  await prisma.goal.upsert({
    where:  { id: 'demo-goal' },
    update: {},
    create: {
      id:           'demo-goal',
      userId:       user.id,
      title:        'Reserva de emergência',
      category:     'FINANCIAL',
      targetValue:  30000,
      currentValue: 5000,
      unit:         'R$',
    },
  })
  console.log('✅ Meta criada')

  // Demo transactions
  const txs = [
    { title: 'Salário',       amount: 5000, type: 'INCOME'  as const, date: new Date() },
    { title: 'Aluguel',       amount: 1500, type: 'EXPENSE' as const, date: new Date() },
    { title: 'Supermercado',  amount: 400,  type: 'EXPENSE' as const, date: new Date() },
    { title: 'Freelancer',    amount: 1200, type: 'INCOME'  as const, date: new Date() },
    { title: 'Uber',          amount: 80,   type: 'EXPENSE' as const, date: new Date() },
  ]

  for (const tx of txs) {
    await prisma.transaction.create({
      data: { userId: user.id, accountId: account.id, ...tx },
    }).catch(() => {})
  }
  console.log(`✅ ${txs.length} transações criadas`)

  console.log('\n🎉 Seed concluído!')
  console.log('📧 Login: joao@exemplo.com')
  console.log('🔑 Senha: senha123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
