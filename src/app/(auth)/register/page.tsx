'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

const schema = z.object({
  name:            z.string().min(2, 'Mínimo 2 caracteres'),
  email:           z.string().email('E-mail inválido'),
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path:    ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const BENEFITS = [
  'Dashboard com visão completa do seu dia',
  'Controle financeiro inteligente',
  'Rastreador de hábitos com sequências',
  'Pomodoro integrado com registros',
  'Assistente IA personalizado',
  'Metas com progresso visual',
]

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      await registerUser(data.name, data.email, data.password)
      toast.success('Conta criada! Bem-vindo ao Personal Hub 🎉')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar conta')
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 to-indigo-700 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">Personal Hub</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Comece sua jornada<br />de produtividade hoje.
          </h1>
          <ul className="space-y-3">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-center gap-3 text-white/90">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/60 text-sm">
          100% grátis • Dados salvos localmente
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Personal Hub</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Criar conta</h2>
            <p className="text-muted-foreground mt-1">Leva menos de 1 minuto</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nome</label>
              <input
                {...register('name')}
                type="text"
                autoComplete="name"
                placeholder="João Silva"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">E-mail</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="joao@exemplo.com"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Senha</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg border border-input bg-card
                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Confirmar senha</label>
              <input
                {...register('confirmPassword')}
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold
                         rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta…</>
                : 'Criar conta grátis'
              }
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
