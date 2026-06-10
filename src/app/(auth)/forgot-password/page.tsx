'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Zap, CheckCircle2 } from 'lucide-react'
import { api } from '@/services/api'
import toast from 'react-hot-toast'

const schema = z.object({ email: z.string().email('E-mail inválido') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit({ email }: FormData) {
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Erro ao enviar e-mail. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Personal Hub</span>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">E-mail enviado!</h2>
            <p className="text-muted-foreground mb-2">
              Se <strong>{getValues('email')}</strong> estiver cadastrado, você receberá
              as instruções em breve.
            </p>
            <p className="text-sm text-muted-foreground">Verifique também sua caixa de spam.</p>
            <Link href="/login" className="mt-6 inline-block text-primary font-medium hover:underline text-sm">
              ← Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-1">Esqueceu a senha?</h2>
            <p className="text-muted-foreground text-sm mb-7">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">E-mail</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card
                             focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg
                           hover:bg-primary/90 transition-all flex items-center justify-center gap-2
                           disabled:opacity-60"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</> : 'Enviar link de recuperação'}
              </button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Lembrou a senha?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
