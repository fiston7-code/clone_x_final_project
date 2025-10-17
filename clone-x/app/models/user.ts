import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Tweet from '#models/tweet'
import Like from '#models/like'
import Follow from '#models/follow'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @hasMany(() => Tweet)
  declare tweets: HasMany<typeof Tweet>

  @hasMany(() => Like)
  declare likes: HasMany<typeof Like>

  // 1. Relationship to get the Follow records where THIS user is the follower
  @hasMany(() => Follow, {
    foreignKey: 'follower_id', // Look for my ID in the follower_id column
  })
  declare following: HasMany<typeof Follow>

  // 2. Relationship to get the Follow records where THIS user is being followed
  @hasMany(() => Follow, {
    foreignKey: 'following_id', // Look for my ID in the following_id column
  })
  declare followers: HasMany<typeof Follow>

  @column()
  declare name: string | null

  @column()
  declare pseudo: string | null

  @column()
  declare verificationToken: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare bio: string

  @column()
  declare avatar: string

  @column()
  declare isPrivate: boolean

  @column()
  declare isVerified: boolean

  @column()
  declare emailVerifiedAt: DateTime

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
