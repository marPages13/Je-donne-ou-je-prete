import ssoBridgePackage from 'sso-bridge'
import env from '#start/env'

type SsoBridgeFactory = {
  createSSOBridge: (options: { apiKey: string; ssoPortal?: string }) => unknown
}

const { createSSOBridge } = ssoBridgePackage as SsoBridgeFactory

export function createBridgeFromEnv() {
  const apiKey = env.get('API_KEY')
  const ssoPortal = env.get('SSO_PORTAL')

  if (!apiKey) {
    throw new Error('API_KEY manquante dans les variables d environnement')
  }

  return createSSOBridge({
    apiKey,
    ssoPortal,
  })
}
