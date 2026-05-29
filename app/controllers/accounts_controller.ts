import type { HttpContext } from '@adonisjs/core/http'
import DonationObject from '#models/donation-object'
import { purgeSoftDeletedObjects } from '#services/objects_retention_service'
import db from '@adonisjs/lucid/services/db' // <-- Ajout de l'import DB

export default class AccountsController {
  public async account({ view, auth, response }: HttpContext) {
    await purgeSoftDeletedObjects()

    if (!auth.isAuthenticated) {
      return response.redirect('/login')
    }

    const user = auth.user!

    const userObjects = await user.related('posts').query().where('is_deleted', false)

    const reservations = await DonationObject.query()
      .where('reservedBy', user.id)
      .whereNot('userId', user.id)
      .where('is_deleted', false)
      .preload('user')

    // 1. On vérifie si l'utilisateur possède le rôle de référent en base
    const referentRow = await db.from('sustainability_roles')
      .where('role_key', 'referent_durabilite')
      .where('user_id', user.id)
      .first()
    
    const isReferent = !!referentRow // Transforme le résultat en booléen (true/false)

    // 2. On envoie "isReferent" à la vue avec le reste
    return view.render('pages/account', {
      user: user,
      objects: userObjects,
      reservations: reservations,
      isReferent: isReferent // <-- C'est cette variable qui active le @if(isReferent) dans ton Edge
    })
  }
}