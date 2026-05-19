import type { HttpContext } from '@adonisjs/core/http'
import Feedback from '#models/feedback'
import vine from '@vinejs/vine'

export default class FeedbacksController {
  /**
   * Affiche la page de contact (accessible uniquement si connecté)
   */
  async index({ view, auth }: HttpContext) {
    // Optionnel : s'assurer que l'utilisateur est là, sinon Adonis lève une exception automatiquement
    await auth.check() 
    return view.render('pages/contact')
  }

  /**
   * Traite la soumission du formulaire
   */
  async store({ request, response, session, auth }: HttpContext) {
    // 1. Récupérer l'utilisateur connecté (lève une erreur si déconnecté)
    const user = await auth.getUserOrFail()

    // 2. Valider uniquement le message (VineJS)
    const schema = vine.object({
      message: vine.string().trim(),
    })
    const payload = await vine.validate({ schema, data: request.all() })

    // 3. Sauvegarder dans la DB en combinant les infos du user + le message
    await Feedback.create({
      name: user.Username ?? 'Utilisateur inconnu',
      email: user.email ?? 'email inconnu',
      message: payload.message,
    })

    // 4. Notification et redirection
    session.flash('success', 'Merci pour votre feedback ! Il a bien été enregistré.')
    return response.redirect().toPath('/home') // Redirection vers l'accueil ou ailleurs
  }
}