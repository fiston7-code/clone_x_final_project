import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Tweet from '#models/tweet'

export default class SearchesController {
  public async search({ request, view }: HttpContext) {
    // 1️⃣ Récupération du terme de recherche
    const query = request.input('q')

    // Si pas de terme -> affiche la home sans résultats
    if (!query || query.trim().length < 2) {
      return view.render('pages/home_x', {
        query: '',
        users: [],
        tweets: [],
      })
    }

    const searchTerm = `%${query}%`

    // 2️⃣ Recherche des utilisateurs
    const users = await User.query()
      .whereILike('name', searchTerm)
      .orWhereILike('pseudo', searchTerm)
      .limit(10)
      .select(['id', 'name', 'pseudo', 'avatar', 'bio'])

    // 3️⃣ Recherche des tweets
    const tweets = await Tweet.query()
      .whereILike('content', searchTerm)
      .preload('user', (q) => q.select(['id', 'name', 'pseudo', 'avatar']))
      .preload('replies', (replyQuery) => {
        replyQuery
          .preload('user', (u) => u.select(['id', 'name', 'pseudo', 'avatar']))
          .orderBy('createdAt', 'asc')
      })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .preload('likes')

    // 4️⃣ Rendu de la page home avec résultats
    return view.render('pages/home_x', {
      query,
      users,
      tweets,
    })
  }
}
