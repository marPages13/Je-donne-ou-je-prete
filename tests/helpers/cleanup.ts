import db from '@adonisjs/lucid/services/db'

export async function resetDatabase() {
  await db.from('feedbacks').delete()
  await db.from('cherche_objects').delete()
  await db.from('donation_objects').delete()
  await db.from('users').delete()
}
