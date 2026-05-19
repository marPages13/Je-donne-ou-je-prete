import type { HttpContext } from '@adonisjs/core/http'
import DonationObject from '#models/donation-object'
import { purgeSoftDeletedObjects } from '#services/objects_retention_service'

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
    return view.render('pages/account', {
      user: user,
      objects: userObjects,
      reservations: reservations,
    })
  }
}
