/**
 * Serviço de e-mail usando Resend (https://resend.com)
 * Gratuito até 3.000 e-mails/mês.
 * Alternativa: substitua por Nodemailer + SMTP.
 */
import { Resend } from 'resend'
import { logger } from './logger'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_NAME  = process.env.NEXT_PUBLIC_APP_NAME ?? 'Personal Hub'
const FROM      = process.env.EMAIL_FROM           ?? 'noreply@personalhub.app'
const BASE_URL  = process.env.NEXT_PUBLIC_APP_URL  ?? 'http://localhost:3000'

// ─── Templates ────────────────────────────────────────────

function passwordResetTemplate(name: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Redefinir senha — ${APP_NAME}</title></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#f1f5f9;margin:0;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px">
      <h1 style="color:#fff;font-size:24px;margin:0">⚡ ${APP_NAME}</h1>
    </div>
    <div style="padding:32px 40px">
      <h2 style="font-size:20px;color:#0f172a;margin-top:0">Olá, ${name}!</h2>
      <p style="color:#64748b;line-height:1.6">
        Recebemos uma solicitação para redefinir a senha da sua conta.
        Clique no botão abaixo para criar uma nova senha.
      </p>
      <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px">
        Redefinir minha senha
      </a>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6">
        Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição,
        ignore este e-mail com segurança — sua conta está protegida.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="color:#94a3b8;font-size:12px;margin:0">
        Se o botão não funcionar, copie e cole este link:<br>
        <a href="${resetUrl}" style="color:#6366f1">${resetUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>
`.trim()
}

function welcomeTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Bem-vindo ao ${APP_NAME}!</title></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#f1f5f9;margin:0;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px">
      <h1 style="color:#fff;font-size:24px;margin:0">⚡ ${APP_NAME}</h1>
    </div>
    <div style="padding:32px 40px">
      <h2 style="font-size:20px;color:#0f172a;margin-top:0">Bem-vindo, ${name}! 🎉</h2>
      <p style="color:#64748b;line-height:1.6">
        Sua conta foi criada com sucesso. O ${APP_NAME} está pronto para centralizar
        sua rotina, finanças, hábitos, estudos e metas em um único lugar.
      </p>
      <a href="${BASE_URL}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px">
        Acessar o painel
      </a>
    </div>
  </div>
</body>
</html>
`.trim()
}

// ─── Funções de envio ─────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
): Promise<boolean> {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`
  try {
    const { error } = await resend.emails.send({
      from:    FROM,
      to,
      subject: `[${APP_NAME}] Redefinir sua senha`,
      html:    passwordResetTemplate(name, resetUrl),
    })
    if (error) throw new Error(error.message)
    logger.info({ to }, 'Password reset email sent')
    return true
  } catch (err) {
    logger.error(err, 'Failed to send password reset email')
    return false
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: `Bem-vindo ao ${APP_NAME}! 🎉`,
      html:    welcomeTemplate(name),
    })
    logger.info({ to }, 'Welcome email sent')
  } catch (err) {
    // Não bloqueia o cadastro se o e-mail falhar
    logger.warn(err, 'Failed to send welcome email (non-critical)')
  }
}
