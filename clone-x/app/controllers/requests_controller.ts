import type { HttpContext } from '@adonisjs/core/http'
// import User from '#models/user'

export default class RequestsController {
  /**
   * 🔒 Activer le mode privé
   */
  public async makePrivate({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Non authentifié')

    user.isPrivate = true
    await user.save()

    return response.redirect().back()
  }

  /**
   * 🔓 Rendre le compte public
   */
  public async makePublic({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Non authentifié')

    user.isPrivate = false
    await user.save()

    return response.redirect().back()
  }

  /**
   *  (Optionnel) Page de gestion de confidentialité
   */
  public async showSettings({ auth, view, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Non authentifié')

    return view.render('pages/settings', { user })
  }
}
