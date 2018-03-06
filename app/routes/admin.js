const express = require('express')
const passport = require('passport')
const userController = require('../controllers/user.controller')
const errorHandler = require('../errorHandler')
// const jsonwebtoken = require('jsonwebtoken')
const _ = require('lodash')
const validator = require('validator')
const jwtConfig = require('../config/jwt')
const jwt = require('express-jwt')
// const User = require('../models/User')
const middleware = require('../middleware')
// const passportConfig = require('../config/passport')(passport)

let router = express.Router()

// User registration form-- for admin
router.get('/signup', function (req, res) {
  res.render('signup')
})

// ADMIN HOME
router.get('/', function (req, res) {
  res.render('home')
})

// Handle user registration-- for admin
router.post('/signup', async function (req, res, next) {
  const username = req.body.username || ''
  const password = req.body.password || ''
  const role = req.body.role

  res.locals.flashUrl = '/admin/signup'

  if (!username || validator.isEmpty(username)) return errorHandler.errorResponse('INVALID_FIELD', 'username', next)
  if (!password || validator.isEmpty(password)) return errorHandler.errorResponse('INVALID_FIELD', 'role', next)
  // if (!role || role.length <= 0) return errorHandler.errorResponse('INVALID_FIELD', 'role', next)

  try {
    await userController.registerUser({
      username,
      password
    })

    passport.authenticate('local')(req, res, function () {
      req.flash('success', 'Successfully signed you in as ' + req.body.username)
      res.redirect(req.session.returnTo || '/admin')
      delete req.session.returnTo
    })
  } catch (e) {
    e = e.toString()
    if (e.indexOf('registered')) return next('A center with same name is already registered')
    next(e)
  }
})

// Student signup -JWT
// router.post('/signup', async (req, res, next) => {
//   console.log('body', req.body)
//   const username = req.body.username
//   const password = req.body.password
//   const role = req.body.role
//   if (!username || !password) {
//     res.json({
//       success: false,
//       msg: 'Please enter username and password.'
//     })
//   } else if (!role || role.length <= 0) return errorHandler.errorResponse('INVALID_FIELD', 'role', next)
//   else {
//     let newUser = new User({
//       username,
//       password,
//       role
//     })
//     try {
//       let createdUser = await userController.saveUser(newUser)
//       res.json({
//         success: true,
//         msg: 'Successfully created new user.',
//         user: createdUser
//       })
//     } catch (err) {
//       let errMsg = errorHandler.getErrorMessage(err)
//       if (errMsg.indexOf('duplicate')) return next(new Error('This username is already taken.'))
//       else return next(err)
//     }
//   }
// })

// Student login form-- admin
router.get('/login', function (req, res) {
  res.render('login', {
    error: res.locals.msg_error[0]
  })
})

// Handle user login -- for admin
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/admin/login',
  successFlash: 'Welcome back',
  failureFlash: true
}),
function (req, res) {
  res.redirect(req.session.returnTo || '/admin')
  delete req.session.returnTo
})

// Handle user login JWT
// router.post('/login', function (req, res, next) {
//   let username = req.body.username
//   let password = req.body.password
//   if (!username || !password) {
//     return res.json({
//       success: false,
//       msg: 'Please enter username and password.'
//     })
//   } else {
//     User.findOne({
//       username: username
//     }, function (err, user) {
//       if (err) next(err)

//       if (!user) {
//         res.json({
//           success: false,
//           msg: 'Authentication failed. User not found.'
//         })
//       } else {
//         // Check if password matches
//         user.comparePassword(req.body.password, function (err, isMatch) {
//           if (isMatch && !err) {
//             // Create token if the password matched and no error was thrown
//             const token = jsonwebtoken.sign(user.toObject(), jwtConfig.jwtSecret, {
//               expiresIn: '24h' // 1 day
//             })

//             res.json({
//               success: true,
//               msg: 'Successfully logged you in as ' + username,
//               token: token,
//               user
//             })
//           } else {
//             res.json({
//               success: false,
//               msg: 'Authentication failed. Username or Password did not match.'
//             })
//           }
//         })
//       }
//     })
//   }
// })

// User logout-- admin
router.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/admin')
})

router.get('/test', jwt({
  secret: jwtConfig.jwtSecret
}), middleware.isAdmin, (req, res) => {
  console.log('logged in user', req.user)
  res.sendStatus(200)
})

module.exports = router
