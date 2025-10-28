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
const FollowsController = () => import('#controllers/profil_controller')
const SearchesController = () => import('#controllers/searches_controller')
const RequestsController = () => import('#controllers/requests_controller')
const BlocksController = () => import('#controllers/blocks_controller')

// router.on('/').render('pages/home')

// show pages
router.on('/').render('pages/welcome')
router.get('/signUp', [AuthController, 'showRegister']).as('signUp.show')
router.get('/login', [AuthController, 'showLogin']).as('login.show')
router.get('/home', [TweetsController, 'showAllTweets']).as('home.show').use(middleware.auth())
router.get('/search', [SearchesController, 'search']).as('search').use(middleware.auth())
router
  .post('/update', [FollowsController, 'updateUserInfo'])
  .as('update.user')
  .use(middleware.auth())

// routes auth with google

// OAuth Google
router.get('/auth/google/redirect', [SessionController, 'redirectToGoogle'])
router.get('/auth/google/callback', [SessionController, 'handleGoogleCallback'])

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

//route follow

router
  .group(() => {
    // GET /profil (Shows the currently logged-in user's profile)
    router.get('profil', [FollowsController, 'showProfilPage']).as('profil.base')

    // POST /users/:id/follow (Follow action)
    router.post('users/:id/follow', [FollowsController, 'follow']).as('follow')

    // POST /users/:id/unfollow (Unfollow action)
    router.post('users/:id/unfollow', [FollowsController, 'unfollow']).as('unfollow')
  })
  .use(middleware.auth()) // Authentication applied to all routes in this group

router
  .get('/privacy', [RequestsController, 'showSettings'])
  .as('privacy.settings')
  .use(middleware.auth())
router
  .post('/privacy/private', [RequestsController, 'makePrivate'])
  .as('privacy.private')
  .use(middleware.auth())
router
  .post('/privacy/public', [RequestsController, 'makePublic'])
  .as('privacy.public')
  .use(middleware.auth())

// les routes pour le bloquage

// Assurez-vous d'appliquer le middleware d'authentification

//  Route pour bloquer un utilisateur
router.post('/users/:id/block', [BlocksController, 'block']).as('user.block').use(middleware.auth())

// 🔓 Route pour débloquer un utilisateur
// Utiliser POST simplifie souvent les formulaires, mais DELETE est plus sémantique pour une suppression
router
  .post('/users/:id/unblock', [BlocksController, 'unblock'])
  .as('user.unblock')
  .use(middleware.auth())

// 📝 Route pour afficher la liste des utilisateurs bloqués
router
  .get('/settings/blocked', [BlocksController, 'index'])
  .as('user.blocked.index')
  .use(middleware.auth())

// MUST be placed AFTER the authenticated GET /profil to ensure /profil always hits the authenticated route.
router
  .get('profil/:id', [FollowsController, 'showProfilPage'])
  .as('profil.show')
  .use(middleware.auth())

// GET /profil/:id/followers (Publicly viewable list)
router
  .get('profil/:id/followers', [FollowsController, 'showFollowers'])
  .as('followers.show')
  .use(middleware.auth())

// GET /profil/:id/following (Publicly viewable list)
router
  .get('profil/:id/following', [FollowsController, 'showFollowing'])
  .as('following.show')
  .use(middleware.auth())

// store and login users
router.post('/register', [AuthController, 'storeUser']).as('store.user')
router.post('/login', [SessionController, 'loginUser']).as('login.user')
router.post('/logout', [SessionController, 'logoutUser']).as('logout')
router.post('/postTweets', [TweetsController, 'storeTweet']).as('postTweet').use(middleware.auth())

router.post('/send', '#controllers/authController.email')

router.get('/sendEmail', [AuthController, 'showEmail']).as('email')
