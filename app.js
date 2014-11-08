var express = require('express')
var path = require('path')
var http = require('http')
var hipchat = require('node-hipchat');
var bodyparser = require('body-parser')
var logger = require('morgan')
var timeout = require('connect-timeout')
var routes = require('./routes')
var router = express.Router()
var server
var app = express()

var HC = new hipchat('a054b26a420f7c8f23f321f8134a3b')

//Configuration
app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// Middleware
app.use(bodyparser.urlencoded())
app.use(timeout('30s'))
app.use(logger('dev'))
app.use(express.static(path.join(__dirname, 'public')))
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
router.get('/s', routes.search.search)


//FEEDBACK
router.post('/feedback', function(req, res) {
  var params = {
    room: 958947, 
    from: 'Feedback',
    message: req.body.msg
  };

  HC.postMessage(params, function(data) {
    req.end()
  });
})






  




server = http.createServer(app)

server.on('error', function (err) {
  console.error(err)
})

process.on('uncaughtException', function (err) {
  console.error('uncaughtException: ', err.message)
  console.error(err.stack)
  //process.exit(1)
})

server.listen(app.get('port'), function() {
  console.log('app listening at port: ' + app.get('port'))
})