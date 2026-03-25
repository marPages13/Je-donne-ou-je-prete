import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'
import type { InferMailers } from '@adonisjs/mail/types'

/**
 * Construction automatique du pool SMTP à partir du .env.
 */
const smtpPool: {
  name: string
  host: string
  port: number
  user: string
  pass: string
}[] = []

// smtp1 basé sur la config principale
smtpPool.push({
  name: 'smtp1',
  host: env.get('SMTP_HOST')!,
  port: Number(env.get('SMTP_PORT', 587)),
  user: env.get('SMTP_USERNAME')!,
  pass: env.get('SMTP_PASSWORD')!,
})

// smtp2..smtp10 basés sur SMTP2_*, SMTP3_* ... SMTP10_*
for (let i = 2; i <= 10; i++) {
  const prefix = `SMTP${i}_`

  const host = (env.get((prefix + 'HOST') as any, '') || '') as string
  const user = (env.get((prefix + 'USERNAME') as any, '') || '') as string
  const pass = (env.get((prefix + 'PASSWORD') as any, '') || '') as string
  const port = Number(env.get((prefix + 'PORT') as any, 587))

  if (host && user && pass) {
    smtpPool.push({
      name: `smtp${i}`,
      host,
      port,
      user,
      pass,
    })
  }
}

// On garde uniquement les entrées complètes (sécurité supplémentaire)
const validSmtpPool = smtpPool.filter((s) => !!s.host && !!s.user && !!s.pass)

export function getNextMailerName() {
  if (validSmtpPool.length === 0) {
    // Sécurité : revient sur le mailer par défaut "smtp"
    return 'smtp'
  }

  const randomIndex = Math.floor(Math.random() * validSmtpPool.length)
  return validSmtpPool[randomIndex].name
}

const dynamicMailers: Record<string, ReturnType<typeof transports.smtp>> = {}

for (const smtp of validSmtpPool) {
  dynamicMailers[smtp.name] = transports.smtp({
    host: smtp.host,
    port: smtp.port,
    auth: {
      type: 'login',
      user: smtp.user,
      pass: smtp.pass,
    },
  })
}

const mailConfig = defineConfig({
  default: 'smtp',

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST')!,
      port: Number(env.get('SMTP_PORT', 587)),
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME')!,
        pass: env.get('SMTP_PASSWORD')!,
      },
    }),

    ...dynamicMailers,
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
