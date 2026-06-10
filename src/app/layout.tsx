import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/contexts/query-provider'
import { AuthProvider }  from '@/contexts/auth-context'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'Personal Hub',
    template: '%s — Personal Hub',
  },
  description: 'Seu sistema inteligente de gestão pessoal: rotina, finanças, hábitos, estudos e metas em um só lugar.',
  keywords: ['produtividade', 'finanças', 'hábitos', 'gestão pessoal', 'dashboard'],
  authors: [{ name: 'João' }],
  robots: 'noindex, nofollow', // privado
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f0f1a' },
  ],
  width:        'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'hsl(var(--card))',
                    color:      'hsl(var(--card-foreground))',
                    border:     '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize:   '0.875rem',
                  },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
