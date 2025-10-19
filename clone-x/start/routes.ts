/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

import { sep, normalize } from 'node:path'
import app from '@adonisjs/core/services/app'
const AuthController = () => import('#controllers/authController')
const SessionController = () => import('#controllers/session_controller')
const TweetsController = () => import('#controllers/tweets_controller')
const LikesController = () => import('#controllers/likes_controller')
const RetweetsController = () => import('#controllers/retweets_controller')

// router.on('/').render('pages/home')

// show pages
router.on('/').render('pages/welcome')
router.get('/signUp', [AuthController, 'showRegister']).as('signUp.show')
router.get('/login', [AuthController, 'showLogin']).as('login.show')
router.get('/home', [TweetsController, 'showAllTweets']).as('home.show').use(middleware.auth())

// Route pour servir les uploads
// =======================
const PATH_TRAVERSAL_REGEX = /(?:^|[\\/])\.\.(?:[\\/]|$)/

router.get('/uploads/*', async ({ request, response }) => {
  // Récupère le chemin demandé
  const filePath = request.param('*').join(sep)
  const normalizedPath = normalize(filePath)

  // Protection contre la traversée de répertoires
  if (PATH_TRAVERSAL_REGEX.test(normalizedPath)) {
    return response.badRequest('Chemin invalide')
  }

  // Création du chemin absolu vers le fichier dans /storage/uploads
  const absolutePath = app.makePath('storage/uploads', normalizedPath)

  try {
    return response.download(absolutePath)
  } catch {
    return response.notFound('Fichier introuvable')
  }
})

// route for like

router.post('/like/:id', [LikesController, 'toggleLike']).as('tweets.like').use(middleware.auth())

// route for retweet
router
  .post('/tweets/:id/retweet', [RetweetsController, 'toggleRetweet'])
  .as('tweet.retweet')
  .use(middleware.auth())
router
  .post('/tweets/:id/quote', [RetweetsController, 'quote'])
  .as('tweet.quote')
  .use(middleware.auth())

// route for reply
router
  .post('/tweets/:id/reply', [TweetsController, 'reply'])
  .as('tweets.reply')
  .use(middleware.auth())

// route for delete tweet
router
  .post('/tweets/:id', [TweetsController, 'deleteTweet'])
  .as('tweets.delete')
  .use(middleware.auth())

// store and login users
router.post('/register', [AuthController, 'storeUser']).as('store.user')
router.post('/login', [SessionController, 'loginUser']).as('login.user')
router.post('/logout', [SessionController, 'logoutUser']).as('logout')
router.post('/postTweets', [TweetsController, 'storeTweet']).as('postTweet').use(middleware.auth())
