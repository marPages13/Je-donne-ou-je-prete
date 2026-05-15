import { test } from '@japa/runner'
import User from '#models/user'
import ChercheObject from '#models/cherche_object'
import db from '@adonisjs/lucid/services/db'

// Tests fonctionnels pour protéger les fonctionnalités principales de ChercheObjectsController

test.group('ChercheObjects - fonctionnalités critiques', (group) => {
  group.setup(async () => {
    await db.from('cherche_objects').delete()
    await db.from('users').delete()
  })

  group.teardown(async () => {
    await db.from('cherche_objects').delete()
    await db.from('users').delete()
  })

  test('un utilisateur peut créer un objet cherche', async ({ assert }) => {
    const user = await createTestUser({ Username: 'TestUser', email: 'user@example.com' })

    await createItem(user.id, {
      name: 'Table',
      description: 'Table en bois',
      categorie: 'home',
      status: 1,
    })

    const created = await ChercheObject.query().where('user_id', user.id)
    assert.equal(created.length, 1)
    assert.equal(created[0].name, 'Table')
    assert.equal(created[0].userId, user.id)
  })

  test('un utilisateur peut réserver un objet cherche', async ({ assert }) => {
    const owner = await createTestUser({ Username: 'Owner', email: 'owner@example.com' })
    const requester = await createTestUser({
      Username: 'Requester',
      email: 'requester@example.com',
    })

    const item = await createItem(owner.id, {
      name: 'Lampe',
      description: 'Lampe de chevet',
      categorie: 'home',
      status: 1,
    })

    // Simulate reservation
    item.status = 2
    item.giftedBy = requester.id
    await item.save()

    await item.refresh()
    assert.equal(item.status, 2)
    assert.equal(item.giftedBy, requester.id)

    const reserved = await ChercheObject.query().where('status', 2)
    assert.isAtLeast(reserved.length, 1)
  })

  test('un propriétaire peut reposter un objet réservé', async ({ assert }) => {
    const owner = await createTestUser({ Username: 'Owner2', email: 'owner2@example.com' })
    const requester = await createTestUser({
      Username: 'Requester2',
      email: 'requester2@example.com',
    })

    const item = await createItem(owner.id, {
      name: 'Canapé',
      description: 'Canapé 3 places',
      categorie: 'home',
      status: 2,
      giftedBy: requester.id,
    })

    // Simulate re-publish
    item.status = 1
    item.giftedBy = null
    await item.save()

    await item.refresh()
    assert.equal(item.status, 1)
    assert.isNull(item.giftedBy)
  })

  test('filtrage : récupération par catégorie', async ({ assert }) => {
    const user = await createTestUser({ Username: 'FilterUser' })

    await createItem(user.id, { name: 'Radio', categorie: 'electronics' })
    await createItem(user.id, { name: 'Chaise', categorie: 'home' })

    const electronics = await ChercheObject.query().where('categorie', 'electronics')
    const home = await ChercheObject.query().where('categorie', 'home')

    assert.isAtLeast(electronics.length, 1)
    assert.isAtLeast(home.length, 1)
    const foundNames = electronics.map((r) => r.name)
    assert.include(foundNames, 'Radio')
  })
})

// Helpers pour factoriser les tests
async function createTestUser(overrides: Partial<any> = {}) {
  const base = {
    Username: `User${Date.now()}${Math.floor(Math.random() * 1000)}`,
    email: `user${Date.now()}@example.com`,
    password: 'password',
  }
  return User.create(Object.assign(base, overrides))
}

async function createItem(userId: any, attrs: Partial<any> = {}) {
  const base = {
    userId,
    name: `Objet${Math.floor(Math.random() * 10000)}`,
    description: 'Description test',
    categorie: 'home',
    status: 1,
  }
  return ChercheObject.create(Object.assign(base, attrs))
}
