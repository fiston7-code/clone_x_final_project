import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Ajout du jeton de vérification
      table.string('verification_token').nullable().unique()
      // Ajout de la date de vérification
      table.timestamp('email_verified_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('verification_token')
      table.dropColumn('email_verified_at')
    })
  }
}
