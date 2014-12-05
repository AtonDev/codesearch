
var express = require('express')
var path = require('path')
var http = require('http')
var hipchat = require('node-hipchat')
var bodyparser = require('body-parser')
var cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session')
var logger = require('morgan')
var timeout = require('connect-timeout')
var router = express.Router()
var server
var Schema = require('jugglingdb').Schema


var HC = new hipchat('a054b26a420f7c8f23f321f8134a3b')

var schema
if (process.env.NODE_ENV == 'development') {
  schema = new Schema('postgres', {
    database: 'codesearch'
  })
} else {
  var newrelic = require('newrelic')
  schema = new Schema('postgres', {
    url: process.env.DATABASE_URL 
  })  
}
  

var app = express()
//Configuration
app.set('schema', schema)
app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';


//make app available to models and controllers
var models = require('./models/')(app)
var routes = require('./routes')(app)




// Middleware
app.use(function(req, res, next) {
  res.locals.environment = process.env.NODE_ENV || ''
  next()
})
app.use(bodyparser.urlencoded({extended: true}))
app.use(timeout('20s'))
app.use(logger('dev'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())
app.use(cookieSession({
  keys: ['key1', 'key2']
}))
app.use(router)
app.use(function(req, res) { 
  res.status(404)
  res.render('errors/404', {title: '404: Page not found'}) 
})
app.use(function(err, req, res, next) { 
  console.error(err)
  console.error(err.stack)
  res.status(500)
  res.render('errors/500', {title: '500: Internal server error'}) 
 })

// INDEX
router.get('/', function(req, res){
  res.render('search/index', {results:[]})
})

// SEARCH
router.get('/s', routes.search.s)


// API
router.get('/api/s', routes.search.api)


// POPULATE DB
router.all('/handcards*', routes.handcards.authenticate)
router.get('/handcards', routes.handcards.index)
router.get('/handcards/get/:id', routes.handcards.show)
router.get('/handcards/new', routes.handcards.new)
router.post('/handcards/create', routes.handcards.create)
router.get('/handcards/edit/:id', routes.handcards.edit)
router.post('/handcards/update/:id', routes.handcards.update)
router.post('/handcards/delete/:id', routes.handcards.destroy)
router.get('/admin/login', routes.handcards.newlogin)
router.post('/admin/login', routes.handcards.login)


//FEEDBACK
router.post('/feedback', function(req, res) {
  var params = {
    room: 958947, 
    from: 'Feedback',
    message: req.body.msg,
    color: 'random'
  };

  HC.postMessage(params, function(data) {
    res.end()
  });
})




// BASIC ERROR HANDLING
process.on('uncaughtException', function (err) {
  console.error('uncaughtException: ', err.message)
  console.error(err.stack)
  //process.exit(1)
})


// INITIALISATION
server = http.createServer(app)

server.on('error', function (err) {
  console.error(err)
})


schema.isActual(function(err, actual) {
  if (!actual) {
      schema.autoupdate();
  }
  server.listen(app.get('port'), function() {
    console.log('app listening at port: ' + app.get('port'))
  })
});


module.exports.app = app