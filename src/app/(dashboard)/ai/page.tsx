'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, User, Sparkles, Lightbulb, TrendingUp, Clock } from 'lucide-react'
import { aiService } from '@/services/api'
import { cn } from '@/utils/helpers'
import type { AiMessage } from '@/types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// ─── Suggested prompts ────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: 'Quanto gastei este mês?',              category: 'finance' },
  { icon: Clock,      text: 'Quais tarefas estão atrasadas?',       category: 'tasks' },
  { icon: Sparkles,   text: 'O que devo fazer hoje?',               category: 'productivity' },
  { icon: Lightbulb,  text: 'Como melhorar minha produtividade?',   category: 'productivity' },
  { icon: TrendingUp, text: 'Quanto falta para minha meta financeira?', category: 'finance' },
  { icon: Lightbulb,  text: 'Quais hábitos estou falhando?',        category: 'habits' },
]

// ─── Message bubble ───────────────────────────────────────

function MessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-primary' : 'bg-gradient-brand',
      )}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-card border border-border rounded-tl-sm',
      )}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          'text-2xs mt-1.5',
          isUser ? 'text-primary-foreground/60' : 'text-muted-foreground',
        )}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

export default function AiPage() {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role:      'assistant',
      content:   'Olá, João! Sou seu assistente pessoal inteligente. Posso analisar seus dados de finanças, tarefas, hábitos, estudos e metas para te ajudar a tomar decisões mais inteligentes.\n\nExperimente perguntar algo como "Quanto gastei este mês?" ou "O que devo priorizar hoje?"',
      createdAt: new Date().toISOString(),
    }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading) return

    setInput('')
    const userMsg: AiMessage = {
      role:      'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages(m => [...m, userMsg])
    setLoading(true)

    try {
      const res = await aiService.chat(content)
      const assistantMsg: AiMessage = {
        role:      'assistant',
        content:   res.data.reply,
        createdAt: new Date().toISOString(),
      }
      setMessages(m => [...m, assistantMsg])
    } catch {
      toast.error('Erro ao se comunicar com a IA')
      setMessages(m => [...m, {
        role:      'assistant',
        content:   'Desculpe, ocorreu um erro. Tente novamente.',
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const isInitial = messages.length <= 1

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assistente IA</h1>
          <p className="text-muted-foreground text-sm">Seu consultor pessoal inteligente</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30
                        text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Online
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 bg-card rounded-2xl border border-border p-5">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts (only when initial) */}
      {isInitial && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUGGESTED_PROMPTS.map(p => (
            <button
              key={p.text}
              onClick={() => sendMessage(p.text)}
              className="flex items-center gap-2 px-3 py-2.5 bg-card border border-border rounded-xl
                         text-xs text-left hover:bg-muted hover:border-primary/30 transition-all
                         card-hover group"
            >
              <p.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>{p.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-4">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage() }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte algo sobre suas finanças, tarefas, hábitos…"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-input bg-card text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                       disabled:opacity-60 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-primary text-primary-foreground rounded-xl
                       hover:bg-primary/90 transition-colors disabled:opacity-50
                       flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          A IA analisa seus dados reais para dar respostas personalizadas
        </p>
      </div>
    </div>
  )
}
