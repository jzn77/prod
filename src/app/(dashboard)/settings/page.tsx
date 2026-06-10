'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, User, Bell, Wallet, Shield, Download, Upload } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/utils/helpers'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [currency, setCurrency] = useState('BRL')
  const [notifications, setNotifications] = useState(true)

  const sections = [
    {
      id:    'profile',
      icon:  User,
      title: 'Perfil',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nome</label>
              <input
                defaultValue={user?.name}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">E-mail</label>
              <input
                defaultValue={user?.email}
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium
                             hover:bg-primary/90 transition-colors">
            Salvar alterações
          </button>
        </div>
      ),
    },
    {
      id:    'appearance',
      icon:  Sun,
      title: 'Aparência',
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">Tema</p>
            <div className="flex gap-3">
              {[
                { value: 'light',  label: 'Claro',  icon: Sun },
                { value: 'dark',   label: 'Escuro', icon: Moon },
                { value: 'system', label: 'Sistema', icon: Monitor },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 flex-1 transition-all',
                    theme === t.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id:    'finance',
      icon:  Wallet,
      title: 'Finanças',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Moeda principal</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-input bg-background text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="BRL">Real Brasileiro (R$)</option>
              <option value="USD">Dólar Americano ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      id:    'notifications',
      icon:  Bell,
      title: 'Notificações',
      content: (
        <div className="space-y-4">
          {[
            { label: 'Notificações desktop',   desc: 'Receba alertas no seu computador' },
            { label: 'Tarefas atrasadas',       desc: 'Alertar quando uma tarefa vencer' },
            { label: 'Lembrete de hábitos',     desc: 'Notificar hábitos não concluídos' },
            { label: 'Alertas financeiros',     desc: 'Avisos de gastos acima da média' },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(v => !v)}
                className={cn(
                  'w-11 h-6 rounded-full relative transition-all',
                  notifications ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span className={cn(
                  'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                  notifications && 'translate-x-5',
                )} />
              </button>
            </div>
          ))}
        </div>
      ),
    },
    {
      id:    'data',
      icon:  Shield,
      title: 'Dados & Privacidade',
      content: (
        <div className="space-y-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm
                             hover:bg-muted transition-colors w-full">
            <Download className="w-4 h-4" />
            Exportar meus dados (JSON)
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm
                             hover:bg-muted transition-colors w-full">
            <Upload className="w-4 h-4" />
            Importar dados
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-destructive/30 rounded-xl
                             text-sm text-destructive hover:bg-destructive/5 transition-colors w-full mt-4">
            <Shield className="w-4 h-4" />
            Excluir minha conta
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Personalize sua experiência</p>
      </div>

      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.id} className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <section.icon className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">{section.title}</h2>
            </div>
            {section.content}
          </div>
        ))}
      </div>
    </div>
  )
}
