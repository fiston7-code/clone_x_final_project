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

  //login avec google

  // redirection vers google

  public async redirectToGoogle({ ally }: HttpContext) {
    return ally.use('google').redirect()
  }

  // Callback après authentification Google
  public async handleGoogleCallback({ ally, auth, response, session }: HttpContext) {
    try {
      console.log('Callback Google appelé')

      // Récupère les infos utilisateur depuis Google
      const googleUser = await ally.use('google').user()
      console.log('Google user:', googleUser)

      // Cherche l'utilisateur dans la base via l'email
      let user = await User.findBy('email', googleUser.email)

      // Si l'utilisateur n'existe pas, on le crée
      if (!user) {
        user = await User.create({
          name: googleUser.name,
          email: googleUser.email,
          pseudo: googleUser.name.replace(/\s+/g, '').toLowerCase(), // ou autre logique pour pseudo unique
          avatar: googleUser.avatarUrl || null,
        })
      }

      // Connexion automatique
      await auth.use('web').login(user)

      return response.redirect().toRoute('home.show')
    } catch (error) {
      console.error(error)
      session.flash({ error: 'Impossible de se connecter avec Google' })
      return response.redirect().back()
    }
  }
}
