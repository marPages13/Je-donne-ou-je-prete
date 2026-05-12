import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

type MailCallback = Parameters<typeof mail.send>[0]

let warnedMailDisabled = false
let disabledDueToAuth = false

function isSmtpConfigured() {
  const host = (env.get('SMTP_HOST') || '').trim()
  const user = (env.get('SMTP_USERNAME') || '').trim()
  const pass = (env.get('SMTP_PASSWORD') || '').trim()
  return !!(host && user && pass)
}

/**
 * Envoie un email en utilisant un SMTP choisi dans le pool.
 * - Choix aléatoire d'un mailer dans smtpPool (config/mail.ts)
 * - En cas d'erreur, fallback sur le mailer par défaut "smtp"
 */
export async function sendWithPool(callback: MailCallback) {
  if (disabledDueToAuth) return

  if (!isSmtpConfigured()) {
    if (!warnedMailDisabled) {
      warnedMailDisabled = true
      console.warn(
        'SMTP non configuré (SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD). Envoi de mail désactivé.'
      )
    }
    return
  }

  try {
    await mail.use('smtp').send(callback)
  } catch (error) {
    const anyError = error as any
    if (anyError?.code === 'EAUTH') {
      console.error(
        'Erreur SMTP: authentification échouée (EAUTH). Vérifie SMTP_HOST/SMTP_PORT/SMTP_USERNAME/SMTP_PASSWORD (et SMTP_SECURE si port 465).'
      )
      disabledDueToAuth = true
    }
    console.error('Erreur avec le mailer smtp', error)
  }
}
