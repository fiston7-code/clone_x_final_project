import { DateTime } from 'luxon'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { column, BaseModel, belongsTo } from '@adonisjs/lucid/orm'

export default class Tweet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare content: string | null

  @column({ columnName: 'media_url' })
  declare mediaUrl: string | null

  @column({ columnName: 'parent_id' })
  declare parentId: number | null

  @belongsTo(() => Tweet, {
    foreignKey: 'parentId',
  })
  declare parent: BelongsTo<typeof Tweet>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
