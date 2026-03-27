import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'
import Hash from '@adonisjs/core/services/hash'
import ssoBridgePackage from 'sso-bridge'
import { createBridgeFromEnv } from '#services/sso_bridge_service'
import env from '#start/env'
import User from '#models/user'

type SsoResult = {
  email: string
  username: string
  error: string
  isSuccess: () => boolean
}

type SsoHandlers = {
  loginRedirect: (ctx: HttpContext, customRedirectParams?: Record<string, string>) => Promise<unknown>
  callback: (ctx: HttpContext) => Promise<SsoResult | unknown>
  logout: (ctx: HttpContext) => unknown
}

type SsoAdonisFactory = {
  createAdonisSSOHandlers: (
    bridge: unknown,
    options?: {
      sessionKey?: string
      callbackPath?: string
      afterLogoutPath?: string
    }
  ) => SsoHandlers
}

const { createAdonisSSOHandlers } = ssoBridgePackage as unknown as SsoAdonisFactory

export default class SsoTestController {
  private normalizeUsername(rawEmail: string) {
    const localPart = rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail
    const source = localPart.trim().replace(/\./g, '-')
    const cleaned = source.replace(/[^a-zA-Z0-9_-]/g, '')
    return (cleaned || 'sso_user').slice(0, 40)
  }

  private async makeUniqueUsername(baseUsername: string) {
    let candidate = baseUsername
    let suffix = 1

    while (await User.findBy('Username', candidate)) {
      candidate = `${baseUsername}_${suffix}`.slice(0, 40)
      suffix += 1
    }

    return candidate
  }

  private async findOrCreateSsoUser(payload: SsoResult) {
    const email = payload.email?.trim().toLowerCase() || null
    const usernameFromSso = payload.username?.trim() || ''

    let user = email ? await User.findBy('email', email) : null

    if (!user && usernameFromSso) {
      user = await User.findBy('Username', usernameFromSso)
    }

    if (user) {
      return user
    }

    const baseUsername = this.normalizeUsername(email || '')
    const username = await this.makeUniqueUsername(baseUsername)
    const password = await Hash.make(randomBytes(32).toString('hex'))

    return User.create({
      Username: username,
      email,
      password,
      extainre: false,
      isadmin: false,
    })
  }

  private makeHandlers() {
    const bridge = createBridgeFromEnv()

    return createAdonisSSOHandlers(bridge, {
      sessionKey: 'sso_bridge_correlation_id',
      callbackPath: '/sso/callback',
      afterLogoutPath: '/sso/test',
    })
  }

  public async status({ response }: HttpContext) {
    return response.send({
      package: 'sso-bridge',
      ok: true,
      env: {
        hasApiKey: Boolean(env.get('API_KEY')),
        ssoPortal: env.get('SSO_PORTAL') || null,
      },
      endpoints: {
        login: '/sso/login',
        callback: '/sso/callback',
        logout: '/sso/logout',
      },
      message:
        'Utilise /sso/login pour tester la redirection SSO puis reviens ici pour verifier l etat.',
    })
  }

  public async loginRedirect(ctx: HttpContext) {
    const handlers = this.makeHandlers()
    return handlers.loginRedirect(ctx, { source: 'adonis-test' })
  }

  public async callback(ctx: HttpContext) {
    const handlers = this.makeHandlers()
    const result = await handlers.callback(ctx)

    if (result && typeof result === 'object' && 'isSuccess' in result) {
      const ssoResult = result as SsoResult

      if (!ssoResult.isSuccess()) {
        ctx.session.flash({ error: `Connexion SSO echouee: ${ssoResult.error}` })
        return ctx.response.redirect('/login')
      }

      const user = await this.findOrCreateSsoUser(ssoResult)
      await ctx.auth.use('web').login(user)

      ctx.session.put('sso_test_user', {
        email: ssoResult.email,
        username: ssoResult.username,
      })

      ctx.session.flash({ success: 'Connexion SSO reussie' })

      return ctx.response.redirect('/home')
    }

    return result
  }

  public logout(ctx: HttpContext) {
    const handlers = this.makeHandlers()
    return handlers.logout(ctx)
  }
}
