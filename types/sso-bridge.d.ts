declare module 'sso-bridge' {
  export interface SsoBridgeInstance {
    generateCorrelationId(): Promise<string>
    retrieveLoginInfo(correlationId: string): Promise<{
      email: string
      username: string
      error?: string
      isSuccess: () => boolean
    }>
  }

  function ssoBridge(options: { apiKey: string; portal: string }): SsoBridgeInstance

  export default ssoBridge
}
