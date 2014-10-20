var express = require('express')
var querystring = require('qs')
var path = require('path')
var http = require('http')

var routes = require('./routes')

var app = express()


//Configuration
app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// Middleware
app.use(express.static(path.join(__dirname, 'public')))

// INDEX
app.get('/', function(req, res){
  //res.send('hello')
  res.render('search/index')
})

// SEARCH
app.get('/s', routes.search.search)









http.createServer(app).listen(app.get('port'), function() {
  console.log('app listening at port: ' + app.get('port'))
})