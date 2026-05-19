import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { UserFactory } from '#database/factories/user_factory'

export default class extends BaseSeeder {
  async run() {
    const specificUsers = [
      {
        username: 'Admin',
        email: 'dami.scoot3@gmail.com',
        password: 'Admin',
        extainre: false,
        isadmin: true,
      },
      {
        username: 'Test',
        email: 'test@example.com',
        password: '1234',
        extainre: false,
        isadmin: false,
      },
      {
        username: 'Guest',
        email: 'guest@example.com',
        password: 'Guest',
        extainre: true,
        isadmin: false,
      },
    ]

    // On boucle pour insérer ou mettre à jour sans crasher sur la contrainte UNIQUE
    for (const userData of specificUsers) {
      await User.updateOrCreate(
        { email: userData.email }, // Clé de recherche
        userData                   // Données à insérer/modifier
      )
    }

    // Génération aléatoire entre 50 et 700 utilisateurs
    const totalToCreate = Math.floor(Math.random() * (700 - 50 + 1)) + 50
    await UserFactory.createMany(totalToCreate)
  }
}