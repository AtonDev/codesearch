var express = require('express')
var path = require('path')
var http = require('http')
var logger = require('morgan')
var routes = require('./routes')
var server
var app = express()


//Configuration
app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// Middleware
app.use(express.static(path.join(__dirname, 'public')))
app.use(logger('dev'))

// INDEX
app.get('/', function(req, res){
  //res.send('hello')
  res.render('search/index', {results:[]})
})

// SEARCH
app.get('/s', routes.search.search)






server = http.createServer(app)

server.on('error', function (err) {
  console.error(err)
})

process.on('uncaughtException', function (err) {
  console.error('uncaughtException: ', err.message)
  console.error(err.stack)
  process.exit(1)
})

server.listen(app.get('port'), function() {
  console.log('app listening at port: ' + app.get('port'))
})