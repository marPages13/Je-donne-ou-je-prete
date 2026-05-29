// database/migrations/xxxxxx_add_referent_flag_to_objects.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('donation_objects', (table) => {
      table.boolean('as_referent').notNullable().defaultTo(false)
    })
    this.schema.alterTable('cherche_objects', (table) => {
      table.boolean('as_referent').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable('donation_objects', (table) => {
      table.dropColumn('as_referent')
    })
    this.schema.alterTable('cherche_objects', (table) => {
      table.dropColumn('as_referent')
    })
  }
}