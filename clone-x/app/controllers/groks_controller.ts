import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'

export default class GroksController {
     public async showAI({ view, auth }: HttpContext) {
      const user = auth.user
      return view.render('pages/AI', { user })
    }
    

}