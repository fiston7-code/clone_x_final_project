import type { HttpContext } from '@adonisjs/core/http'
import Tweet from '#models/tweet'
import { tweetValidation } from '#validators/data_validation'
import User from '#models/user'
import Block from '#models/block'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'

export default class TweetsController {
  // information de l'utilisateur dans le side bar
  public async showUserInfo({ view }: HttpContext) {
    const users = await User.query().select(['id', 'name']).orderBy('name', 'asc')
    return view.render('pages/home_x', { users: users })
  }

  // sauvegarde le tweet dans la base de donne

  public async storeTweet({ request, response, auth, session }: HttpContext) {
    try {
      // 1. Validation des champs textuels (content, parentId)
      const { content, parentId, media } = await request.validateUsing(tweetValidation)

      if (!auth.user) {
        return response.unauthorized('User not authenticated')
      }

      if ((!content || content.trim() === '') && !media) {
        session.flash({ error: 'Le tweet ne peut pas être vide.' })
        return response.redirect().back()
      }

      const user = auth.user
      let mediaUrl: string | null = null

      // 3. Gestion du fichier média
      if (media) {
        // Déplacer le fichier vers /storage/uploads
        await media.move(app.makePath('storage/uploads/tweets'), {
          name: `${cuid()}.${media.extname}`,
          overwrite: false,
        })

        // Vérification si le fichier a bien été déplacé
        if (!media.fileName) {
          throw new Error('Erreur lors du déplacement du fichier média')
        }

        mediaUrl = `uploads/${media.fileName}`
      }

      // 3. Création du tweet avec le lien vers le média
      await user.related('tweets').create({
        content: content || null,
        parentId: parentId || null,
        mediaUrl: mediaUrl || null,
      })

      return response.redirect().toRoute('home.show')
    } catch (error) {
      // Gestion des erreurs de validation ou autres
      session.flash({ error: 'Une erreur est survenue lors de la création du tweet.' })
      return response.badRequest({ error: error.message })
    }
  }

  // reply a un tweet

  public async reply({ params, request, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('User not authenticated')

    const { content } = request.only(['content'])
    const parentId = params.id

    await user.related('tweets').create({
      content,
      parentId, // le tweet auquel on répond
    })

    return response.redirect().back()
  }

  // suppression d'un tweet

  public async deleteTweet({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('User not authenticated')

    const tweet = await Tweet.find(params.id)
    if (!tweet) return response.notFound('Tweet not found')

    if (tweet.userId !== user.id) {
      return response.forbidden("Vous n'avez pas la permission de supprimer ce tweet.")
    }

    await tweet.delete()
    return response.redirect().toRoute('home.show')
  }

  // affichage de tous les tweets

  public async showAllTweets({ view, auth }: HttpContext) {
    const currentUserId = auth.user?.id
    let blockedUserIds: number[] = []

    // 🧱 Étape 1 : récupérer tous les utilisateurs bloqués (dans les deux sens)
    if (currentUserId) {
      const blocks = await Block.query()
        .where('blocker_id', currentUserId)
        .orWhere('blocked_id', currentUserId)

      blockedUserIds = blocks.map((b) =>
        b.blockerId === currentUserId ? b.blockedId : b.blockerId
      )
    }

    // 🐦 Étape 2 : récupérer tous les tweets sauf ceux des utilisateurs bloqués
    const tweets = await Tweet.query()
      .whereNull('parent_id')
      .if(blockedUserIds.length > 0, (query) => {
        query.whereNotIn('user_id', blockedUserIds)
      })
      .preload('user', (query) => query.select(['id', 'name', 'pseudo', 'avatar']))
      .preload('likes', (query) => query.select(['user_id']))
      .preload('replies', (query) =>
        query
          .preload('user', (query) => query.select(['id', 'name', 'pseudo', 'avatar']))
          .preload('likes', (query) => query.select(['user_id']))
          .select(['id', 'content', 'user_id', 'parent_id', 'created_at'])
      )
      .orderBy('created_at', 'desc')

    // 🧭 Étape 3 : afficher la page avec les tweets filtrés
    return view.render('pages/home_x', { tweets })
  }
}
