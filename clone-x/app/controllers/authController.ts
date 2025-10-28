import type { HttpContext } from '@adonisjs/core/http'
import { accoutValidation } from '#validators/data_validation'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import { cuid } from '@adonisjs/core/helpers'

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

      // Génération du token de vérification
      const token = cuid()

      // Création de l'utilisateur
      const user = await User.create({
        name,
        pseudo,
        email,
        password,
        verificationToken: token,
        isVerified: false,
      })

      // Envoi du mail de confirmation
      await mail.send((message) => {
        message.from('fistonkalambayi7@gmail.com').to(email).subject('Confirmez votre email').html(`
          Bonjour ${name},<br><br>
          Cliquez sur ce lien pour activer votre compte : 
          <a href="http://localhost:3333/verify/${token}">Confirmer mon email</a>
        `)
      })

      session.flash({
        success: 'Un email de confirmation a été envoyé. Vérifiez votre boîte mail.',
      })
      return response.redirect().toRoute('login.show')
    } catch (error) {
      session.flash({
        error: "Assurez-vous d'avoir saisi au moins 6 caractères pour le mot de passe",
      })
      return response.redirect().back()
    }
  }
}
