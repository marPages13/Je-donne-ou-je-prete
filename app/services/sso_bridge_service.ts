import ssoBridgePackage from 'sso-bridge'
import env from '#start/env'

// On définit l'interface pour avoir l'autocomplétion et éviter les erreurs
interface SsoBridge {
  generateCorrelationId(): Promise<string>
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

  // @ts-ignore - On cast pour utiliser les méthodes du SDK
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
  return (ssoBridgePackage as any).createAdonisSSOFlow(bridge, {
    callbackPath: '/sso/callback',
    afterLogoutPath: '/',
    loginPath: '/sso/login',
    logoutPath: '/sso/logout',
    successRedirect: '/home',
    failureRedirect: '/login',
    authGuard: 'web',
    ...options,
  })
}