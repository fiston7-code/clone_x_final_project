import type { HttpContext } from '@adonisjs/core/http'
import Block from '#models/block'
import Follow from '#models/follow'
import Request from '#models/request'

export default class BlocksController {
  // ... (méthodes block, unblock, index inchangées mais désormais fonctionnelles)

  /**
   *  Bloquer un utilisateur
   */
  public async block({ auth, params, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Non authentifié')

    const targetId = Number(params.id)
    if (user.id === targetId) {
      return response.badRequest('Vous ne pouvez pas vous bloquer vous-même')
    }

    // Vérifier si déjà bloqué (utilisé ici pour retourner un message clair)
    const existingBlock = await Block.query()
      .where('blocker_id', user.id)
      .andWhere('blocked_id', targetId)
      .first()

    if (existingBlock) {
      return response.badRequest('Utilisateur déjà bloqué')
    }

    //  Créer le blocage
    await Block.create({
      blockerId: user.id,
      blockedId: targetId,
    })

    // Supprimer toutes les relations de suivi existantes (A suit B, OU B suit A)
    await Follow.query()
      .where('follower_id', user.id)
      .where('following_id', targetId)
      .orWhere('follower_id', targetId)
      .where('following_id', user.id)
      .delete()

    // 📨 Supprimer d’éventuelles demandes de suivi
    await Request.query()
      .where((q) => {
        q.where('requester_id', user.id).andWhere('target_id', targetId)
      })
      .orWhere((q) => {
        q.where('requester_id', targetId).andWhere('target_id', user.id)
      })
      .delete()

    return response.redirect().back()
  }

  /**
   *  Débloquer un utilisateur
   */
  public async unblock({ auth, params, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Non authentifié')

    const targetId = Number(params.id)

    const block = await Block.query()
      .where('blocker_id', user.id)
      .andWhere('blocked_id', targetId)
      .first()

    if (!block) {
      return response.badRequest('Utilisateur non bloqué')
    }

    await block.delete()
    return response.redirect().back()
  }

  /**
   * Voir la liste des utilisateurs bloqués
   */
  public async index({ auth, view }: HttpContext) {
    const user = auth.user
    if (!user) return view.render('errors/unauthorized')

    const blockedUsers = await Block.query()
      .where('blocker_id', user.id)
      .preload('blocked', (q) => q.select(['id', 'name', 'pseudo', 'avatar']))

    return view.render('pages/blocked_users', { blockedUsers })
  }
}
