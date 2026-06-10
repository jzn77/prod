import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()

  // Redireciona para login se não autenticado
  if (!user) redirect('/login')

  return <DashboardShell>{children}</DashboardShell>
}
