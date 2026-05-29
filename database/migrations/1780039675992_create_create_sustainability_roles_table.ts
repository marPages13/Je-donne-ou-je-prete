// database/migrations/xxxxxx_create_sustainability_roles.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sustainability_roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // L'utilisateur qui détient actuellement le rôle
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.string('role_key').notNullable().unique().defaultTo('referent_durabilite')
      table.timestamps()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}