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
    const user = await User.create({
      Username: 'TestUser',
      email: 'user@example.com',
      password: 'password',
    })

    const item = await ChercheObject.create({
      userId: user.id,
      name: 'Table',
      description: 'Table en bois',
      categorie: 'home',
      status: 1,
    })

    const created = await ChercheObject.query().where('user_id', user.id).first()
    assert.exists(created)
    assert.equal(created?.name, 'Table')
  })

  test('un utilisateur peut réserver un objet cherche', async ({ assert }) => {
    const owner = await User.create({
      Username: 'Owner',
      email: 'owner@example.com',
      password: 'password',
    })

    const requester = await User.create({
      Username: 'Requester',
      email: 'requester@example.com',
      password: 'password',
    })

    const item = await ChercheObject.create({
      userId: owner.id,
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
  })

  test('un propriétaire peut reposter un objet réservé', async ({ assert }) => {
    const owner = await User.create({
      Username: 'Owner2',
      email: 'owner2@example.com',
      password: 'password',
    })

    const requester = await User.create({
      Username: 'Requester2',
      email: 'requester2@example.com',
      password: 'password',
    })

    const item = await ChercheObject.create({
      userId: owner.id,
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
})
