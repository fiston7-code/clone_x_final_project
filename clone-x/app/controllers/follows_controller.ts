import type { HttpContext } from '@adonisjs/core/http'
import Follow from '#models/follow'
import User from '#models/user'

export default class FollowsController {
  public async showProfilPage({ view, auth, params, response }: HttpContext) {
    const userIdFromParams = Number(params.id) // L'ID dans l'URL (si présent)
    const currentUserId = auth.user?.id

    // Déterminer l'ID du profil à afficher : ID dans l'URL, sinon ID de l'utilisateur connecté
    const targetUserId = userIdFromParams || currentUserId

    if (!targetUserId) {
      // Si l'utilisateur n'est pas connecté ET qu'aucun ID n'est passé en paramètre
      return response.unauthorized('Vous devez vous connecter pour voir cette page.')
    }

    try {
      // 1. Récupérer l'utilisateur cible
      const user = await User.query()
        .where('id', targetUserId)
        .preload('tweets', (tweetQuery) => {
          tweetQuery.preload('user')
          tweetQuery.orderBy('createdAt', 'desc')
        })
        .firstOrFail()

      // 2. Calcul des compteurs (Réutilisé dans toutes les vues de profil)
      const followersCountResult = await Follow.query()
        .where('following_id', targetUserId)
        .count('* as total')
      const followingCountResult = await Follow.query()
        .where('follower_id', targetUserId)
        .count('* as total')
      const followersCount = Number(followersCountResult[0].$extras.total)
      const followingCount = Number(followingCountResult[0].$extras.total)

      // 3. Vérification si l’utilisateur connecté suit le profil cible (seulement si l'utilisateur est connecté)
      const isFollowed =
        currentUserId && currentUserId !== targetUserId
          ? await Follow.query()
              .where('follower_id', currentUserId)
              .where('following_id', targetUserId)
              .first()
          : false

      // 4. Rendu de la vue pour l'onglet 'tweets'
      return view.render('pages/profil', {
        user,
        tweets: user.tweets, // Modèles non sérialisés pour `toRelative()`
        followersCount,
        followingCount,
        isFollowed: !!isFollowed, // Convertir en booléen
        currentTab: 'tweets',
        followers: [], // Passé vide
        following: [], // Passé vide
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      return response.notFound('Profil utilisateur non trouvé.')
    }
  }

  /**
   * Suivre un utilisateur
   */
  public async follow({ auth, params, response }: HttpContext) {
    const user = auth.user
    // 1.1.1 Vérification de l'authentification
    if (!user) {
      return response.unauthorized('User not authenticated')
    }

    const followingId = Number(params.id)

    // 1.1.2 Vérification : Ne pas pouvoir se suivre soi-même
    if (user.id === followingId) {
      return response.badRequest({ error: 'Vous ne pouvez pas vous suivre vous-même.' })
    }

    // 1.1.3 Vérification : Ne pas pouvoir suivre plusieurs fois le mâme utilisateur
    const existingFollow = await Follow.query()
      .where('follower_id', user.id)
      .where('following_id', followingId)
      .first()

    if (existingFollow) {
      return response.badRequest({ error: 'Vous suivez deja cet utilisateur.' })
    }

    // 1.1.4 Vérification : Ne pas pouvoir suivre un utilisateur qui n'existe pas
    const followingUser = await User.find(followingId)

    if (!followingUser) {
      return response.badRequest({ error: "Cet utilisateur n'existe pas." })
    }

    // 1.1.5 Création du suivi
    await Follow.create({ followerId: user.id, followingId })

    return response.redirect().back()
  }

  public async unfollow({ auth, params, response }: HttpContext) {
    const user = auth.user
    // 1.1.1 Vérification de l'authentification
    if (!user) {
      return response.unauthorized('User not authenticated')
    }

    const followingId = Number(params.id)

    // suppression du suivi
    await Follow.query().where('follower_id', user.id).where('following_id', followingId).delete()

    return response.redirect().back()
  }

  // affichage de tous les suiveurs

  /**
   * Afficher le profil avec abonnés
   */
  public async showFollowers({ auth, params, view, response }: HttpContext) {
    const userId = Number(params.id)
    const currentUser = auth.user

    // Récupérer l'utilisateur cible (et gérer le 404 si non trouvé)
    const user = await User.find(userId)
    if (!user) {
      return response.notFound('Profil utilisateur non trouvé')
    }

    // 2. Calcul du nombre d'abonnés / abonnements
    const followersCountResult = await Follow.query()
      .where('following_id', userId)
      .count('* as total')
    const followingCountResult = await Follow.query()
      .where('follower_id', userId)
      .count('* as total')

    const followersCount = Number(followersCountResult[0].$extras.total)
    const followingCount = Number(followingCountResult[0].$extras.total)

    // 3. Récupération de la liste des abonnés (Followers)
    const followerRecords = await Follow.query()
      .where('following_id', userId) // On cherche les Follows où l'utilisateur cible est "following"
      .preload('follower', (q) => q.select(['id', 'name', 'pseudo', 'avatar'])) // Précharge les infos du follower

    // Transformer la liste des enregistrements Follow en une liste d'utilisateurs
    const followers = followerRecords.map((f) => f.follower)

    // 4. Vérification si l’utilisateur connecté suit le profil actuel (pour le bouton "Suivre/Abonné")
    const isFollowed =
      currentUser && currentUser.id !== userId
        ? await Follow.query()
            .where('follower_id', currentUser.id)
            .where('following_id', userId)
            .first()
        : false

    return view.render('pages/profil', {
      user,
      tweets: [],
      followersCount,
      followingCount,
      followers,
      following: [],
      isFollowed: !!isFollowed,
      currentTab: 'followers', // Indique l'onglet actif
    })
  }

  // affichage de tous les abonnements
  public async showFollowing({ auth, params, view, response }: HttpContext) {
    const userId = Number(params.id)
    const currentUser = auth.user

    const user = await User.find(userId)
    if (!user) {
      return response.notFound('Profil utilisateur non trouvé')
    }

    // recuperation des tweets du profil
    // const tweets = await user
    //   .related('tweets')
    //   .query()
    //   .preload('user')
    //   .preload('likes')
    //   .preload('replies')
    //   .orderBy('created_at', 'desc')

    // calcul du nombre d'abonnements

    const followersCountResult = await Follow.query()
      .where('following_id', userId)
      .count('* as total')
    const followingCountResult = await Follow.query()
      .where('follower_id', userId)
      .count('* as total')

    const followersCount = Number(followersCountResult[0].$extras.total)
    const followingCount = Number(followingCountResult[0].$extras.total)

    const isFollowed =
      currentUser && currentUser.id !== userId
        ? await Follow.query()
            .where('follower_id', currentUser.id)
            .where('following_id', userId)
            .first()
        : false

    // 1. Récupération de la liste des abonnements (Following)
    const followingRecords = await Follow.query()
      .where('follower_id', userId) // On cherche les Follows où l'utilisateur cible est "follower"
      .preload('following', (q) => q.select(['id', 'name', 'pseudo', 'avatar'])) // Précharge les infos de la personne suivie

    // Transformer la liste des enregistrements Follow en une liste d'utilisateurs
    const following = followingRecords.map((f) => f.following)

    // 2. Rendu de la vue
    return view.render('pages/profil', {
      user,
      tweets: [],
      // On passe 'following' (la liste d'utilisateurs)
      followers: [],
      following,
      followersCount,
      followingCount,
      currentTab: 'following', // Indique l'onglet actif
      isFollowed: !!isFollowed,
      // Note: On ne passe pas 'followers' car cet onglet affiche 'following'
    })
  }
}
