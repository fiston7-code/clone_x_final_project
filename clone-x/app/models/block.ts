import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Block extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare blockerId: number // celui qui bloque

  @column()
  declare blockedId: number // celui qui est bloqué

  @belongsTo(() => User, { foreignKey: 'blockerId' })
  declare blocker: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'blockedId' })
  declare blocked: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
