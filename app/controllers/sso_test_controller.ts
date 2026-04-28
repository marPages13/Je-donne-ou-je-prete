import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'
import Hash from '@adonisjs/core/services/hash'
import { createAdonisSsoFlowFromEnv } from '#services/sso_bridge_service'
import User from '#models/user'

type SsoResult = {
  email: string
  username: string
  error?: string
  isSuccess: () => boolean
}

export default class SsoTestController {
  private flow() {
    return createAdonisSsoFlowFromEnv()
  }

  /**
   * Route de test SSO : GET /sso/test
   * Affiche un état simple et les liens SSO utiles.
   */
  public async status(ctx: HttpContext) {
    return this.flow().status(ctx as any)
  }

  /**
   * PHASE 1 : Redirection vers le portail SSO
   */
  public async loginRedirect({ response, request, session }: HttpContext) {
    return this.flow().loginRedirect({ response, request, session } as any)
  }

  /**
   * PHASE 2 : Retour du portail SSO & Validation
   */
  public async callback(ctx: HttpContext) {
    return this.flow().callbackLogin(ctx as any, (payload: SsoResult) => this.findOrCreateSsoUser(payload))
  }

  /**
   * PHASE 3 : Déconnexion (Locale + Portail)
   */
  public async logout({ auth, response, request, session }: HttpContext) {
    return this.flow().logout({ auth, response, request, session } as any)
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
      extainre: false,
      isadmin: false,
    })
  }

  private normalizeUsername(rawEmail: string) {
    const localPart = rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail
    const cleaned = localPart
      .trim()
      .replace(/\./g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '')
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
