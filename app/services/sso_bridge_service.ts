import ssoBridgePackage from 'edu-sso-bridge'
import env from '#start/env'

// On définit l'interface pour avoir l'autocomplétion et éviter les erreurs
interface SsoBridge {
  generateCorrelationId(): Promise<string>
  buildLoginRedirectUrl(correlationId: string, callbackUrl: string): string
  buildLogoutRedirectUrl(redirectUrl: string): string
  retrieveLoginInfo(correlationId: string): Promise<{
    email: string
    username: string
    error?: string
    isSuccess: () => boolean
  }>
}

/**
 * Initialise le bridge avec les clés du .env
 */
export function createBridgeFromEnv(): SsoBridge {
  const apiKey = env.get('API_KEY') // Ta clé secrète pour parler au bridge
  const ssoPortal = normalizeSsoPortal(env.get('SSO_PORTAL'))

  if (!apiKey) {
    throw new Error('API_KEY (Bridge Token) manquante dans le .env')
  }

  if (!ssoPortal) {
    throw new Error('SSO_PORTAL manquante dans le .env')
  }

  return ssoBridgePackage.createSSOBridge({
    apiKey: apiKey,
    ssoPortal: ssoPortal,
  })
}

function normalizeSsoPortal(raw?: string) {
  if (!raw) return undefined

  const trimmed = String(raw).trim()
  if (!trimmed) return undefined

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  const hasAuthSegment = /\/auth(?:\/|$)/.test(withoutTrailingSlash)
  const base = hasAuthSegment ? withoutTrailingSlash : `${withoutTrailingSlash}/auth`
  return `${base}/`
}

export function createAdonisSsoFlowFromEnv(options: any = {}) {
  const bridge = createBridgeFromEnv() as any
  const config = {
    callbackPath: '/sso/callback',
    afterLogoutPath: '/',
    loginPath: '/sso/login',
    logoutPath: '/sso/logout',
    successRedirect: '/home',
    failureRedirect: '/login',
    authGuard: 'web',
    ...options,
  }

  return {
    async status(ctx: any) {
      return ctx.response.send({
        ok: true,
        loginPath: config.loginPath,
        callbackPath: config.callbackPath,
        logoutPath: config.logoutPath,
        successRedirect: config.successRedirect,
        failureRedirect: config.failureRedirect,
        authGuard: config.authGuard,
      })
    },

    async loginRedirect({ response, request, session }: any) {
      const correlationId = await bridge.generateCorrelationId()
      writeSession(session, 'sso_bridge_correlation_id', correlationId)

      const callbackUrl = buildAbsoluteUrl(request, config.callbackPath)
      const redirectUrl = bridge.buildLoginRedirectUrl(correlationId, callbackUrl)

      return response.redirect(redirectUrl)
    },

    async callbackLogin(ctx: any, createUser: (payload: any) => Promise<any>) {
      const correlationId = readSession(ctx.session, 'sso_bridge_correlation_id')
      const ssoResult = await bridge.retrieveLoginInfo(correlationId)
      const payload = {
        ...ssoResult,
        correlationId,
        raw: ssoResult,
      }

      if (!ssoResult.isSuccess()) {
        return ctx.response.redirect(config.failureRedirect)
      }

      const user = await createUser(payload)
      await ctx.auth.use(config.authGuard).login(user)

      return ctx.response.redirect(config.successRedirect)
    },

    async logout({ auth, response, request }: any) {
      await auth.use(config.authGuard).logout()

      const redirectUrl = buildAbsoluteUrl(request, config.afterLogoutPath)
      return response.redirect(bridge.buildLogoutRedirectUrl(redirectUrl))
    },
  }
}

function readSession(session: any, key: string) {
  if (typeof session?.get === 'function') {
    return session.get(key)
  }

  return undefined
}

function writeSession(session: any, key: string, value: string) {
  if (typeof session?.put === 'function') {
    session.put(key, value)
    return
  }

  if (typeof session?.set === 'function') {
    session.set(key, value)
  }
}

function buildAbsoluteUrl(request: any, path: string) {
  const protocol = typeof request?.protocol === 'function' ? request.protocol() : 'http'
  const host = typeof request?.host === 'function' ? request.host() : 'localhost'
  return new URL(`${protocol}://${host}${path}`).toString()
}
