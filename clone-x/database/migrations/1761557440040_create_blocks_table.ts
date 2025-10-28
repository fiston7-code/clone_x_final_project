import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // 🔑 User who initiated the block (must exist and cannot be null)
      table
        .integer('blocker_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE') // If the blocker is deleted, remove the block record
        .notNullable()

      //  User who is being blocked (must exist and cannot be null)
      table
        .integer('blocked_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE') // If the blocked user is deleted, remove the block record
        .notNullable()

      //  Critical: Ensure a user cannot block the same person multiple times
      table.unique(['blocker_id', 'blocked_id'])

      // ✅ Best Practice: Use timestamps() for better Adonis/Lucid integration
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
