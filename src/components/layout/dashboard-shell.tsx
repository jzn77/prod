'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header }  from './header'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(s => !s)} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
