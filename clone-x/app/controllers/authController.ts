import type { HttpContext } from '@adonisjs/core/http'
import { accoutValidation } from '#validators/data_validation'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'

export default class AuthController {
  public async showRegister({ view }: HttpContext) {
    return view.render('pages/signUp')
  }

  public async showEmail({ view }: HttpContext) {
    return view.render('pages/emailPage')
  }

  public async showLogin({ view }: HttpContext) {
    return view.render('pages/login')
  }

  public async showHome({ view }: HttpContext) {
    return view.render('pages/home_x')
  }

  // store users in the database
  public async storeUser({ request, response, session }: HttpContext) {
    try {
      const { name, pseudo, email, password } = await request.validateUsing(accoutValidation)

      await User.create({
        name: name,
        pseudo,
        email,
        password,
      })

      return response.redirect().toRoute('login.show')
    } catch (error) {
      session.flash({
        error: "assurez vous d'avoir saisie au moins 6 character pour le mot de passe",
      })
      return response.redirect().back()
    }
  }

  public async email({ request }: HttpContext) {
    const email = request.input('email')
    await mail.send((message) => {
      message
        .from('fistonkalambayi7@gmail.com')
        .to(email)
        .subject('merci de confirmer votre email')
        .html('bonjour')
    })
  }
}
