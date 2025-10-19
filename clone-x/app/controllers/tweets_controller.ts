import type { HttpContext } from '@adonisjs/core/http'
import Tweet from '#models/tweet'
import { tweetValidation } from '#validators/data_validation'
import User from '#models/user'
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
        await media.move(app.makePath('storage/uploads'), {
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

  public async showAllTweets({ view }: HttpContext) {
    const tweets = await Tweet.query()
      .preload('user', (query) => query.select(['id', 'name', 'pseudo', 'avatar']))
      .orderBy('created_at', 'desc')

    return view.render('pages/home_x', { tweets: tweets })
  }
}
