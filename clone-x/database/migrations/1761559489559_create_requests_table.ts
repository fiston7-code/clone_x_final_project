import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  //  Changement de nom pour plus de clarté
  protected tableName = 'follow_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Qui demande à suivre
      table
        .integer('requester_id') // Renommé pour plus de clarté (qui demande)
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      //  Qui reçoit la demande
      table
        .integer('target_id') // Renommé pour plus de clarté (qui est ciblé)
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      // Statut de la demande
      table.enum('status', ['pending', 'accepted', 'rejected']).defaultTo('pending').notNullable()
      table.unique(['requester_id', 'target_id'])

      // Utilisation de la méthode standard pour created_at et updated_at
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
