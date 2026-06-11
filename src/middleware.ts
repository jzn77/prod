/**
 * Middleware — roda no Edge Runtime (sem Node.js).
 * Verifica autenticação JWT e modo manutenção.
 * Rate limiting é feito nos próprios API route handlers.
 */
import { NextResponse, type NextRequest } from 'next/server'
import * as jose from 'jose'

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
  '/api/auth/refresh',
  '/api/health',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Modo manutenção
  if (
    process.env.MAINTENANCE_MODE === 'true' &&
    !pathname.startsWith('/maintenance') &&
    !pathname.startsWith('/api/health') &&
    !pathname.startsWith('/_next')
  ) {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // Arquivos estáticos — sem verificação
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|css|js|map)$/)
  ) {
    return NextResponse.next()
  }

  // Rotas públicas
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verificação de token
  const token = request.cookies.get('personal_hub_token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret')
    const { payload } = await jose.jwtVerify(token, secret)
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.sub ?? '')
    return response
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('personal_hub_token')
    response.cookies.delete('personal_hub_refresh')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
