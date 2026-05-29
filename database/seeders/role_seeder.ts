import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // 1. Remplir avec l'email de l'utilisateur existant à qui tu veux donner le rôle
    const targetEmail = 'dami.scoot3@gmail.com' 

    // 2. Trouver l'utilisateur en base de données
    const user = await db.from('users').where('email', targetEmail).first()

    if (!user) {
      console.log(`[Erreur] Aucun utilisateur trouvé avec l'email : ${targetEmail}`)
      return
    }

    // 3. Nettoyer l'ancien référent (puisqu'il ne peut y en avoir qu'un seul à la fois)
    await db.from('sustainability_roles').where('role_key', 'referent_durabilite').del()

    // 4. Insérer le rôle lié à cet utilisateur
    await db.table('sustainability_roles').insert({
      user_id: user.id,
      role_key: 'referent_durabilite',
      created_at: DateTime.now().toSQL(),
      updated_at: DateTime.now().toSQL(),
    })

    console.log(`[Succès] "${user.username}" (ID: ${user.id}) est désormais le Référent Durabilité !`)
  }
}