/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/authController')
const SessionController = () => import('#controllers/session_controller')

// router.on('/').render('pages/home')

// show pages
router.on('/').render('pages/welcome')
router.get('/signUp', [AuthController, 'showRegister']).as('signUp.show')
router.get('/login', [AuthController, 'showLogin']).as('login.show')
router.get('/home', [AuthController, 'showHome']).as('home.show')

// store and login users
router.post('/register', [AuthController, 'storeUser']).as('store.user')
router.post('/login', [SessionController, 'loginUser']).as('login.user')
router.post('/logout', [SessionController, 'logoutUser']).as('logout')
