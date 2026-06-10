'use client'

import { useState } from 'react'
import { Bell, Menu, Moon, Sun, Monitor, Search, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/utils/helpers'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  const themes = [
    { value: 'light',  label: 'Claro',    icon: Sun },
    { value: 'dark',   label: 'Escuro',   icon: Moon },
    { value: 'system', label: 'Sistema',  icon: Monitor },
  ] as const

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center px-4 gap-3
                       bg-background/95 backdrop-blur border-b border-border">
      {/* Menu toggle (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border
                   bg-muted/40 text-muted-foreground hover:bg-muted transition-colors
                   text-sm flex-1 max-w-sm"
      >
        <Search className="w-4 h-4" />
        <span>Pesquisar…</span>
        <kbd className="ml-auto text-2xs border border-border rounded px-1 py-0.5">⌘K</kbd>
      </button>

      <div className="flex-1" />

      {/* Theme switcher */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Tema">
            {theme === 'dark'  ? <Moon className="w-4.5 h-4.5" /> :
             theme === 'light' ? <Sun  className="w-4.5 h-4.5" /> :
                                 <Monitor className="w-4.5 h-4.5" />}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-36 bg-popover border border-border rounded-xl shadow-card-hover p-1 z-50 animate-in"
            align="end"
            sideOffset={8}
          >
            {themes.map(t => (
              <DropdownMenu.Item
                key={t.value}
                onSelect={() => setTheme(t.value)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer',
                  'hover:bg-muted outline-none',
                  theme === t.value && 'text-primary font-medium'
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Notificações">
        <Bell className="w-4.5 h-4.5" />
        {/* Unread dot */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
      </button>

      {/* User menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Perfil"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{initials}</span>
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-48 bg-popover border border-border rounded-xl shadow-card-hover p-1 z-50 animate-in"
            align="end"
            sideOffset={8}
          >
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenu.Item
              onSelect={logout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer
                         hover:bg-destructive/10 text-destructive outline-none"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  )
}
