import { test } from '@japa/runner'
import DonationPolicy from '#policies/donation_policy'
import CherchePolicy from '#policies/cherche_policy'

function fakeUser(id: number, isadmin = false) {
  return { id, isadmin } as any
}

function fakeDonation(userId: number) {
  return { userId } as any
}

function fakeCherche(userId: number) {
  return { userId } as any
}

test.group('Policies', () => {
  test('DonationPolicy autorise edit/delete pour le propriétaire', ({ assert }) => {
    const policy = new DonationPolicy()
    const owner = fakeUser(1)
    const donation = fakeDonation(1)

    assert.isTrue(policy.edit(owner, donation))
    assert.isTrue(policy.delete(owner, donation))
  })

  test('DonationPolicy autorise edit/delete pour admin', ({ assert }) => {
    const policy = new DonationPolicy()
    const admin = fakeUser(99, true)
    const donation = fakeDonation(1)

    assert.isTrue(policy.edit(admin, donation))
    assert.isTrue(policy.delete(admin, donation))
  })

  test('DonationPolicy interdit reserve sur son propre objet', ({ assert }) => {
    const policy = new DonationPolicy()
    const owner = fakeUser(5)
    const donation = fakeDonation(5)

    assert.isFalse(policy.reserve(owner, donation))
  })

  test('CherchePolicy autorise edit/delete pour le propriétaire', ({ assert }) => {
    const policy = new CherchePolicy()
    const owner = fakeUser(1)
    const cherche = fakeCherche(1)

    assert.isTrue(policy.edit(owner, cherche))
    assert.isTrue(policy.delete(owner, cherche))
  })

  test('CherchePolicy autorise edit/delete pour admin', ({ assert }) => {
    const policy = new CherchePolicy()
    const admin = fakeUser(7, true)
    const cherche = fakeCherche(1)

    assert.isTrue(policy.edit(admin, cherche))
    assert.isTrue(policy.delete(admin, cherche))
  })

  test('CherchePolicy interdit reserve sur son propre objet', ({ assert }) => {
    const policy = new CherchePolicy()
    const owner = fakeUser(10)
    const cherche = fakeCherche(10)

    assert.isFalse(policy.reserve(owner, cherche))
  })
})
