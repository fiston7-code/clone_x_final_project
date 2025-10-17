import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class SessionController {
  //login user

  public async loginUser({ request, response, auth, session }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      // verification de donnees
      const user = await User.verifyCredentials(email, password)

      // connecte l'utilisateur

      await auth.use('web').login(user)

      return response.redirect().toRoute('home.show')
    } catch (error) {
      session.flash({ error: 'mot de passe incorrect ou email incorrect' })
      return response.redirect().back()
    }
  }

  // logout the user
  public async logoutUser({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('login.show')
  }
}
