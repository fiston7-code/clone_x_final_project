import type { HttpContext } from '@adonisjs/core/http'
import Tweet from '#models/tweet'
import { quoteValidator } from '#validators/retweet_validation'

export default class RetweetsController {
  /**
   * Retweet simple (sans texte)
   */
  public async toggleRetweet({ params, auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('User not authenticated')

    const originalTweet = await Tweet.find(params.id)
    if (!originalTweet) return response.notFound('Tweet not found')

    // Vérifie si déjà retweeté
    const existingRetweet = await Tweet.query()
      .where('user_id', user.id)
      .where('parent_id', originalTweet.id)
      .whereNull('content')
      .first()

    if (existingRetweet) {
      await existingRetweet.delete()
    } else {
      await Tweet.create({
        userId: user.id,
        parentId: originalTweet.id,
        content: null,
      })
    }

    return response.redirect().back()
  }

  /**
   * Retweet avec citation
   */
  public async quote({ params, request, auth, response, session }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized('User not authenticated')

      const { content } = await request.validateUsing(quoteValidator)

      const originalTweet = await Tweet.find(params.id)
      if (!originalTweet) return response.notFound('Tweet not found')

      // Création d’un nouveau tweet, relié au tweet original
      await Tweet.create({
        userId: user.id,
        parentId: originalTweet.id,
        content,
      })

      session.flash('success', 'Votre citation a été publiée.')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Impossible de citer ce tweet.')
      return response.redirect().back()
    }
  }
}
