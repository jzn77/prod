'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ListTodo, BarChart3, Target, BookOpen,
  Wallet, Calendar, FolderKanban, Bot, Settings,
  Zap, ChevronRight, X, TrendingUp,
} from 'lucide-react'
import { cn } from '@/utils/helpers'

interface NavItem {
  href:  string
  label: string
  icon:  React.ComponentType<{ className?: string }>
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/routine',   label: 'Rotina',     icon: ListTodo },
  { href: '/habits',    label: 'Hábitos',    icon: TrendingUp },
  { href: '/goals',     label: 'Metas',      icon: Target },
  { href: '/studies',   label: 'Estudos',    icon: BookOpen },
  { href: '/finance',   label: 'Finanças',   icon: Wallet },
  { href: '/calendar',  label: 'Calendário', icon: Calendar },
  { href: '/projects',  label: 'Projetos',   icon: FolderKanban },
  { href: '/ai',        label: 'IA',         icon: Bot },
]

interface SidebarProps {
  open:    boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 w-64 flex flex-col',
          'bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">Personal Hub</span>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn('sidebar-item', active && 'active')}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-2xs font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
          <Link
            href="/settings"
            onClick={onClose}
            className={cn('sidebar-item', pathname.startsWith('/settings') && 'active')}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Configurações</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
