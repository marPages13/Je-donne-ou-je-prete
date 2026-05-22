declare module 'sso-bridge' {
  export interface SsoBridgeInstance {
    generateCorrelationId(): Promise<string>
    buildLoginRedirectUrl(correlationId: string, callbackUrl: string): string
    buildLogoutRedirectUrl(redirectUrl: string): string
    retrieveLoginInfo(correlationId: string): Promise<{
      email: string
      username: string
      error?: string
      isSuccess: () => boolean
      [key: string]: unknown
    }>
  }

  export function createSSOBridge(options: { apiKey: string; ssoPortal?: string }): SsoBridgeInstance
  export function createAdonisSSOHandlers(
    bridge: SsoBridgeInstance,
    options?: {
      sessionKey?: string
      callbackPath?: string
      afterLogoutPath?: string
    }
  ): {
    loginRedirect(ctx: any, customRedirectParams?: Record<string, unknown>): Promise<any>
    callback(ctx: any): Promise<any>
    logout(ctx: any): Promise<any>
  }
  export function buildAbsoluteUrl(
    request: any,
    path: string,
    passthrough?: Record<string, unknown>
  ): string

  const ssoBridgePackage: {
    SSOBridge: new (options: { apiKey: string; ssoPortal?: string }) => SsoBridgeInstance
    createSSOBridge: typeof createSSOBridge
    createAdonisSSOHandlers: typeof createAdonisSSOHandlers
    buildAbsoluteUrl: typeof buildAbsoluteUrl
  }

  export default ssoBridgePackage
}
