/* Node, Express, Passport, MongoDB example (nepme) */
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var mongoose = require('mongoose')
var dbUrl = "mongodb://localhost/nepme"

mongoose.connect(dbUrl)
var db = mongoose.connection

db.once('open', function callback() {
  console.log('Connected to mongoDB')
})

var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true}
})

var User = mongoose.model('users', userSchema)

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err) }
      if (!user) {
        console.log('Unknown user ' + username)
        return done(null, false)
      }
      if (password === user.password) {
        return done(null, user)
      }
      else {
        console.log('Invalid password')
        return done(null, false)
      }
    })
  }
))

app.use(bodyParser())
app.use(cookieParser())
app.use(session({ secret: "Node Express Passport MongoDB Example With No BS" }))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', function(req, res) {
  res.sendfile('./views/home.html')
})

app.get('/register', function(req, res) {
  res.sendfile('./views/register.html')
})

app.post('/register', function(req, res) {
  var newUser = new User(req.body)
  newUser.save(function(err, newUser) {
    if(err) { console.log(err) }
    else { console.log('User saved: ' + newUser) }
    req.logIn(newUser, function(err) {
      if (err) { return next(err) }
      return res.redirect('/account')
    })
  })
})

app.get('/login', function(req, res) {
  res.sendfile('./views/login.html')
})

app.post('/login', passport.authenticate('local'), function(req, res) {
  res.redirect('/account')
})

app.get('/account', ensureAuthenticated, function(req, res) {
  res.sendfile('./views/account.html')
})

app.get('/logout', function(req, res){
  req.logout()
  res.redirect('/')
})

app.listen(5000, function() {
  console.log('Server listening on port 5000')
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next() }
    res.redirect('/login')
}