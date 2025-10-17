import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.string('pseudo').unique().notNullable()
      table.string('email').notNullable().unique()
      table.string('password')
      table.text('bio').nullable()
      table.string('avatar').nullable()
      table.boolean('is_private').defaultTo(false)
      table.boolean('is_verified').defaultTo(false)
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
