import { test } from '@japa/runner'
import { createDonationObjectValidator, updateDonationObjectValidator } from '#validators/donation_object'

test.group('DonationObject validators', () => {
  test('create validator accepte un payload minimal valide', async ({ assert }) => {
    const payload = await createDonationObjectValidator.validate({
      name: 'Objet valide',
      description: 'Description suffisamment longue pour valider',
      categorie: 'home',
      type: '0',
    })

    assert.equal(payload.name, 'Objet valide')
    assert.equal(payload.categorie, 'home')
  })

  test('create validator exige les dates quand type=1', async ({ assert }) => {
    await assert.rejects(async () => {
      await createDonationObjectValidator.validate({
        name: 'Objet pret',
        description: 'Description suffisamment longue pour valider',
        categorie: 'home',
        type: '1',
      })
    })
  })

  test('update validator refuse une categorie inconnue', async ({ assert }) => {
    await assert.rejects(async () => {
      await updateDonationObjectValidator.validate({
        name: 'Objet update',
        description: 'Description suffisamment longue pour valider',
        categorie: 'unknown-category',
        type: '0',
      })
    })
  })

  test('update validator valide les dates coherentes', async ({ assert }) => {
    const payload = await updateDonationObjectValidator.validate({
      name: 'Objet update',
      description: 'Description suffisamment longue pour valider',
      categorie: 'tech',
      type: '1',
      available_from: '2026-05-21T10:00',
      available_until: '2026-05-21T12:00',
    })

    assert.equal(payload.categorie, 'tech')
    assert.exists(payload.available_from)
    assert.exists(payload.available_until)
  })
})
