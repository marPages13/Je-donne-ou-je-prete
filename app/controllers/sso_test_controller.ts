import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'
import Hash from '@adonisjs/core/services/hash'
import { createBridgeFromEnv } from '#services/sso_bridge_service'
import env from '#start/env'
import User from '#models/user'

type SsoResult = {
  email: string
  username: string
  error?: string
  isSuccess: () => boolean
}

export default class SsoTestController {
  /**
   * PHASE 1 : Redirection vers le portail SSO
   */
  public async loginRedirect({ response }: HttpContext) {
    const bridge = createBridgeFromEnv() as any
    const cid = await bridge.generateCorrelationId()

    console.log('--- [SSO DÉPART] ---')
    console.log('ID généré:', cid)

    const portal = (env.get('SSO_PORTAL') || '').replace(/\/$/, '')
    
    /**
     * Pour parer aux problèmes de cookies SameSite en HTTP/Localhost,
     * on passe le CID dans l'URL de retour.
     */
    const callbackUrl = `http://127.0.0.1:3333/sso/callback?correlationId=${cid}`
    const finalUrl = `${portal}/redirect?correlationId=${cid}&redirectUri=${encodeURIComponent(callbackUrl)}`

    return response.redirect(finalUrl)
  }

  /**
   * PHASE 2 : Retour du portail SSO & Validation
   */
  public async callback({ request, session, response, auth }: HttpContext) {
    console.log('--- [SSO RETOUR - FINAL FIX] ---')
    
    const cid = request.input('correlationId')
    if (!cid) return response.badRequest('CID manquant')

    try {
      const apiKey = env.get('API_KEY')
      
      // ON RECONSTRUIT L'URL EXACTE DU PHP
      // https://apps.pm2etml.ch/auth/bridge/check
      const portal = (env.get('SSO_PORTAL') || '').replace(/\/$/, '')
      
      // Si ton SSO_PORTAL ne finit pas par /auth, on l'ajoute
      const baseUrl = portal.endsWith('/auth') ? portal : `${portal}/auth`
      const bridgeUrl = `${baseUrl}/bridge/check?token=${apiKey}&correlationId=${cid}`

      console.log('Tentative de GET sur:', bridgeUrl)

      const apiResponse = await fetch(bridgeUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })

      const ssoResult = await apiResponse.json() as any
      console.log('Résultat API:', ssoResult)

      if (ssoResult.error || !ssoResult.email) {
        session.flash({ error: `Erreur : ${ssoResult.error || 'User inconnu'}` })
        return response.redirect('/login')
      }

      // Connexion
      const user = await this.findOrCreateSsoUser(ssoResult)
      await auth.use('web').login(user)
      
      return response.redirect('/home')

    } catch (error) {
      console.error('Erreur technique:', error)
      return response.internalServerError(`Erreur : ${error.message}`)
    }
  }

  /**
   * PHASE 3 : Déconnexion (Locale + Portail)
   */
  public async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    
    const portal = (env.get('SSO_PORTAL') || '').replace(/\/$/, '')
    const postLogoutUrl = encodeURIComponent('http://127.0.0.1:3333/')
    
    return response.redirect(`${portal}/logout?redirectUri=${postLogoutUrl}`)
  }

  /**
   * LOGIQUE PRIVÉE : Gestion de l'utilisateur en base
   */
  private async findOrCreateSsoUser(payload: SsoResult) {
    const email = payload.email?.trim().toLowerCase() || null
    const usernameFromSso = payload.username?.trim() || ''

    // 1. Recherche (Email d'abord, puis Username)
    let user = email ? await User.findBy('email', email) : null
    if (!user && usernameFromSso) {
      user = await User.findBy('Username', usernameFromSso)
    }

    if (user) return user

    // 2. Création si nouveau
    const baseUsername = this.normalizeUsername(email || usernameFromSso)
    const username = await this.makeUniqueUsername(baseUsername)
    const password = await Hash.make(randomBytes(32).toString('hex'))

    return User.create({
      Username: username,
      email,
      password,
      extainre: false, // Vérifie si ce n'est pas 'externe' dans ta migration
      isadmin: false,
    })
  }

  private normalizeUsername(rawEmail: string) {
    const localPart = rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail
    const cleaned = localPart.trim().replace(/\./g, '-').replace(/[^a-zA-Z0-9_-]/g, '')
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
}