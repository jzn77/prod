/**
 * Edge Middleware — executa em todas as rotas antes do handler.
 * Responsabilidades:
 *   1. Rate limiting por IP / usuário
 *   2. Verificação de autenticação JWT
 *   3. Redirecionamentos de segurança
 *   4. Headers de segurança adicionais
 *   5. Modo manutenção
 */
import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getIP, authLimiter, apiLimiter } from '@/lib/rate-limit'

// ─── Rotas públicas (sem autenticação) ───────────────────

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/maintenance',
  '/offline',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
]

const AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
]

// ─── Middleware ───────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getIP(request)

  // 1. Modo manutenção (ativar via env MAINTENANCE_MODE=true)
  if (
    process.env.MAINTENANCE_MODE === 'true' &&
    !pathname.startsWith('/maintenance') &&
    !pathname.startsWith('/api/health') &&
    !pathname.startsWith('/_next')
  ) {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // 2. Ignorar arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // 3. Rate limiting em auth endpoints (proteção brute-force)
  if (AUTH_PATHS.some(p => pathname.startsWith(p))) {
    const result = authLimiter(`auth:${ip}`)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas. Aguarde e tente novamente.' },
        { status: 429, headers: result.headers },
      )
    }
  }

  // 4. Rate limiting geral de API
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('personal_hub_token')?.value
    const identifier = token ?? `ip:${ip}`
    const result = apiLimiter(identifier)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Limite de requisições excedido. Tente novamente em breve.' },
        { status: 429, headers: result.headers },
      )
    }
  }

  // 5. Rotas públicas — sem verificação de auth
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // 6. Verificação de autenticação
  const token = request.cookies.get('personal_hub_token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      )
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const payload = verifyToken(token)
    const response = NextResponse.next()
    // Injecta userId no header para uso nos route handlers
    response.headers.set('x-user-id', payload.sub)
    response.headers.set('x-user-email', payload.email)
    return response
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 },
      )
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('personal_hub_token')
    response.cookies.delete('personal_hub_refresh')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
