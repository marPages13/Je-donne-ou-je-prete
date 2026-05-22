import Hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import DonationObject from '#models/donation-object'
import ChercheObject from '#models/cherche_object'

type UserOverrides = Partial<User>

type DonationOverrides = Partial<DonationObject>

type ChercheOverrides = Partial<ChercheObject>

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

export async function createUser(overrides: UserOverrides = {}) {
  const suffix = uniqueSuffix()
  const password = await Hash.make('password123')

  return User.create({
    Username: `user_${suffix}`,
    email: `user_${suffix}@example.com`,
    password,
    extainre: false,
    isadmin: false,
    ...overrides,
  })
}

export async function createDonationObject(overrides: DonationOverrides = {}) {
  const owner = overrides.userId ? null : await createUser()

  return DonationObject.create({
    userId: owner?.id ?? (overrides.userId as number),
    name: 'Objet test donation',
    description: 'Description de test suffisamment longue',
    type: false,
    status: 1,
    categorie: 'home',
    urgent: false,
    ...overrides,
  })
}

export async function createChercheObject(overrides: ChercheOverrides = {}) {
  const owner = overrides.userId ? null : await createUser()

  return ChercheObject.create({
    userId: owner?.id ?? (overrides.userId as number),
    name: 'Objet test recherche',
    description: 'Description de test suffisamment longue',
    status: 1,
    categorie: 'home',
    urgent: false,
    ...overrides,
  })
}
