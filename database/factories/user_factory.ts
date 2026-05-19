import Factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { DateTime } from 'luxon' // <-- Ajoute l'import de Luxon

export const UserFactory = Factory
  .define(User, ({ faker }) => {
    return {
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: 'Password123!',
      extainre: faker.datatype.boolean({ probability: 0.2 }),
      isadmin: false,
      createdAt: DateTime.fromJSDate(faker.date.recent({ days: 20 })), 
    }
  })
  .build()