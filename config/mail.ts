import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'
import type { InferMailers } from '@adonisjs/mail/types'

function envTrue(key: string) {
  const value = (env.get(key as any, '') || '').toString().trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

const mailConfig = defineConfig({
  default: 'smtp',

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST')!,
      port: Number(env.get('SMTP_PORT', 587)),
      secure: envTrue('SMTP_SECURE'),
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME')!,
        pass: env.get('SMTP_PASSWORD')!,
      },
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
