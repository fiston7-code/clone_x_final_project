import type { HttpContext } from '@adonisjs/core/http'
import Follow from '#models/follow'
import User from '#models/user'
import Block from '#models/block'
import { updateUserInfo } from '#validators/data_validation'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'

export default class FollowsController {
  public async showProfilPage({ view, auth, params, response }: HttpContext) {
    const userIdFromParams = Number(params.id)
    const currentUserId = auth.user?.id
    const targetUserId = userIdFromParams || currentUserId

    if (!currentUserId) {
      return response.unauthorized('Vous devez être connecté pour voir cette page.')
    }

    if (!targetUserId) {
      return response.badRequest('Utilisateur cible invalide.')
    }

    // Vérifie si le profil t’a bloqué
    // const isBlockedByTarget = await Block.query()
    //   .where('blocker_id', targetUserId)
    //   .andWhere('blocked_id', currentUserId)
    //   .first()

    // if (isBlockedByTarget) {
    //   // Si le profil t’a bloqué → accès interdit
    //   return response.forbidden('Ce profil est indisponible.')
    // }

    // Vérifie si tu as bloqué le profil
    const hasBlocked = await Block.query()
      .where('blocker_id', currentUserId)
      .andWhere('blocked_id', targetUserId)
      .first()

    try {
      //  Récupère les infos du profil
      const user = await User.query()
        .where('id', targetUserId)
        .preload('tweets', (tweetQuery) => {
          tweetQuery.preload('user').orderBy('createdAt', 'desc')
        })
        .firstOrFail()

      // Comptage des followers / following
      const followersCount = Number(
        (await Follow.query().where('following_id', targetUserId).count('* as total'))[0].$extras
          .total
      )
      const followingCount = Number(
        (await Follow.query().where('follower_id', targetUserId).count('* as total'))[0].$extras
          .total
      )

      // Vérifie si l’utilisateur connecté suit déjà le profil
      const isFollowed =
        currentUserId !== targetUserId
          ? await Follow.query()
              .where('follower_id', currentUserId)
              .where('following_id', targetUserId)
              .first()
          : false

      // Rendu de la vue
      return view.render('pages/profil', {
        user,
        tweets: user.tweets,
        followersCount,
        followingCount,
        isFollowed: !!isFollowed,
        currentTab: 'tweets',
        followers: [],
        following: [],
        blocked: !!hasBlocked, //  on passe ici la donnée pour le bouton
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

  public async updateUserInfo({ request, response, auth, session }: HttpContext) {
    const user = auth.user!

    //  Validation du formulaire
    const payload = await request.validateUsing(updateUserInfo)

    try {
      //  Vérification / changement du mot de passe
      if (payload.current_password && payload.new_password) {
        try {
          await User.verifyCredentials(user.email, payload.current_password)
        } catch {
          session.flash('errors.current_password', ['Le mot de passe actuel est incorrect.'])
          session.flashExcept(['current_password', 'new_password'])
          return response.redirect().back()
        }
        user.password = payload.new_password
      }

      //  Mise à jour des autres infos utilisateur
      if (payload.name) user.name = payload.name
      if (payload.pseudo) user.pseudo = payload.pseudo
      if (payload.bio) user.bio = payload.bio

      // Gestion d’un nouvel avatar (upload)
      const avatar = request.file('avatar', {
        size: '2mb',
        extnames: ['jpg', 'png', 'jpeg'],
      })

      if (avatar) {
        if (!avatar.isValid) {
          return response.badRequest({ errors: avatar.errors })
        }

        await avatar.move(app.makePath('storage/uploads/avatars'), {
          name: `${cuid()}.${avatar.extname}`,
          overwrite: false,
        })

        if (!avatar.fileName) {
          throw new Error('Erreur lors du déplacement du fichier média')
        }

        user.avatar = `uploads/${avatar.fileName}`
      }

      //  Sauvegarde
      await user.save()

      session.flash('success', 'Profil mis à jour avec succès')
      return response.redirect().back()
    } catch (error) {
      console.error(error)
      session.flash('error', 'Une erreur est survenue lors de la mise à jour.')
      return response.redirect().back()
    }
  }
}
