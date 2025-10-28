import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Request extends BaseModel {
  public static table = 'follow_requests'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare requesterId: number

  @column()
  declare targetId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
