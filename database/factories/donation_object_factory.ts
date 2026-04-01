import factory from '@adonisjs/lucid/factories'
import DonationObject from '#models/donation-object'
import { DateTime } from 'luxon'

export const DonationObjectFactory = factory
  .define(DonationObject, async ({ faker }) => {
const availableImages = [
  'ayszblb8xxbr6b9xhyg4el77.webp',
  'gfr4xhhw37hflfjt5fi35tm9.webp',
  'j89qhtguaz4dl04o2u523bhy.webp',
  'l0omffpcb7howtrp6b3htyzi.webp',
  'n6d4miadmzdh4r4ns5ryfx50.webp',
  'n7drdp41tmoc554wz4fohsch.webp',
  'qrchvdqd4c47wkjoadwsm8o9.webp',
  't4n41e8b0sbcerfn7rxgwz4y.webp',
  'v1jsbhoxtvv56xd3mp7i4ue8.webp',
  'xe2pa2n1c1wktcdcp7sq95hh.webp'
];
    return {
      name: faker.commerce.productName(),
      user_id : 1,
      description: faker.commerce.productDescription(),
      // 'type' est un boolean dans ton modèle
      type: faker.datatype.boolean(),
      // 'status' est un nombre (ex: 0 pour dispo, 1 pour réservé)
      status: faker.number.int({ min: 0, max: 2 }),
      categorie: faker.helpers.arrayElement(['sport', 'books', 'clothes', 'tech', 'home', 'toys', 'appliances', 'art', 'office']),
      imagePath: faker.helpers.arrayElement(availableImages),
      urgent: false,

      // Dates de disponibilité
      availableFrom: DateTime.fromJSDate(faker.date.soon()),
      availableUntil: DateTime.fromJSDate(faker.date.future()),

      // Note : userId et reservedBy seront gérés via les relations
      // ou passés manuellement lors de la création
    }
  })
  .build()
