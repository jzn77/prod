/**
 * Módulo de autenticação — JWT + Refresh Tokens + bcrypt
 *
 * Fluxo de tokens:
 *   - Access Token:  15 min (curta duração, HttpOnly cookie)
 *   - Refresh Token: 30 dias (longa duração, HttpOnly cookie)
 *   - O refresh token é rotacionado a cada uso (proteção contra token theft)
 */
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import prisma from './prisma'

// ─── Constantes ────────────────────────────────────────────

const JWT_ACCESS_SECRET   = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET! + '_refresh'
const ACCESS_TOKEN_COOKIE  = 'personal_hub_token'
const REFRESH_TOKEN_COOKIE = 'personal_hub_refresh'
const IS_PROD = process.env.NODE_ENV === 'production'

// Expiração: 15 min em produção, 7 dias em dev (para facilitar testes)
const ACCESS_EXPIRES_SECONDS  = IS_PROD ? 15 * 60          : 7 * 24 * 60 * 60
const REFRESH_EXPIRES_SECONDS = 30 * 24 * 60 * 60          // 30 dias

export interface JwtPayload {
  sub:   string   // userId
  email: string
  type:  'access' | 'refresh'
  iat?:  number
  exp?:  number
}

// ─── Hashing ───────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/** Gera um token aleatório seguro (para reset de senha, etc.) */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

// ─── JWT ───────────────────────────────────────────────────

export function signAccessToken(payload: Pick<JwtPayload, 'sub' | 'email'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_SECONDS },
  )
}

export function signRefreshToken(payload: Pick<JwtPayload, 'sub' | 'email'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_SECONDS },
  )
}

/** Alias mantido para compatibilidade com middleware */
export function signToken(payload: Pick<JwtPayload, 'sub' | 'email'>): string {
  return signAccessToken(payload)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload
}

// ─── Cookie helpers ────────────────────────────────────────

const COOKIE_BASE = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'lax' as const,
  path:     '/',
}

export function setAuthCookies(userId: string, email: string): void {
  const cookieStore = cookies()
  const accessToken  = signAccessToken({ sub: userId, email })
  const refreshToken = signRefreshToken({ sub: userId, email })

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_BASE,
    maxAge: ACCESS_EXPIRES_SECONDS,
  })
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_BASE,
    maxAge: REFRESH_EXPIRES_SECONDS,
  })
}

/** @deprecated Use setAuthCookies instead */
export function setAuthCookie(token: string): void {
  const cookieStore = cookies()
  cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
    ...COOKIE_BASE,
    maxAge: ACCESS_EXPIRES_SECONDS,
  })
}

export function clearAuthCookies(): void {
  const cookieStore = cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
}

/** @deprecated Use clearAuthCookies */
export function clearAuthCookie(): void {
  clearAuthCookies()
}

// ─── Get current user (API routes) ─────────────────────────

export async function getCurrentUser(req: NextRequest) {
  // Prioridade: cookie → Authorization header
  const token =
    req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) return null

  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({
      where:   { id: payload.sub },
      include: { settings: true },
    })
    return user
  } catch {
    return null
  }
}

/** Get userId rápido via header injetado pelo middleware (sem DB hit) */
export function getUserIdFromRequest(req: NextRequest): string | null {
  return req.headers.get('x-user-id') ?? null
}

// ─── Get current user (Server Components) ──────────────────

export async function getServerUser() {
  const cookieStore = cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!token) return null

  try {
    const payload = verifyToken(token)
    return await prisma.user.findUnique({
      where:   { id: payload.sub },
      include: { settings: true },
    })
  } catch {
    return null
  }
}

// ─── Password reset ─────────────────────────────────────────

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token     = generateSecureToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  // Armazena hash do token para evitar roubo se o DB vazar
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  await prisma.user.update({
    where: { id: userId },
    data:  {
      // Armazena em campo dedicado — adicione ao schema se necessário
      // passwordResetToken: tokenHash,
      // passwordResetExpires: expiresAt,
    },
  })

  // TODO: persist tokenHash + expiresAt in a PasswordReset model
  // Por ora, retorna o token para uso imediato
  return token
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
