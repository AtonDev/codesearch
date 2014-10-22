var YaBoss = require('yaboss')
var config = require('../config')
var http = require('http')


var ybClient = new YaBoss(config.ybKey, config.ybSecret)

//test
var testresults = [{
  snippet: "list1 = ['physics', 'chemistry', 1997, 2000];\nlist2 = [1, 2, 3, 4, 5 ];\nlist3 = ['a', 'b', 'c', 'd'];",
  dispurl: 'www.tutorialspoint.com',
  clickurl: 'http://www.tutorialspoint.com/python/python_lists.htm'
}, {
  snippet: 'recordList = list()',
  dispurl: 'www.stackoverflow.com',
  clickurl: 'http://stackoverflow.com/questions/1470446/create-new-list-object-in-python'
}, {
  snippet: 'class list([iterable])',
  dispurl: 'www.docs.python.org',
  clickurl: 'https://docs.python.org/2/library/functions.html?highlight=list#list'
}]



//private

var sanitizeQuery = function(query) {
  return query
}

var getDispUrl = function(dispurl) {
  return dispurl.replace(/<\/?[^>]+(>|$)/g, "").split('/')[0]
}


var snippetFromHtml = function(url, rawhtml) {
  var snippet = ''
  var htmlparser = require('cheerio')
  $ = htmlparser.load(rawhtml)
  
  //the beginning of a painful day
  snippet = $('pre').first().text()
  if (url.indexOf('tutorialspoint') > -1) {
    snippet = $('pre').first().text() + '\n'
    snippet += $('pre.tryit').text()
  } else if (url.indexOf('') > -1) {

  } else if (url.indexOf('') > -1) {

  } else if (url.indexOf('') > -1) {

  } else if (url.indexOf('') > -1) {

  } else if (url.indexOf('') > -1) {

  } else {
    snippet = $('pre').first().text()
  }
  return snippet
}

//public



var getBossResults = function(req, res, next) {
  var query = sanitizeQuery(req.query.q )
  ybClient.searchWeb(query, {count:20}, function(err,dataFound,response) {
    res.locals.bossdata = JSON.parse(dataFound).bossresponse.web.results
    next()
  })
}

var parseResults = function(req, res, next) {
  var data = res.locals.bossdata
  var snippets = []
  var count = 0
  var getSnippet
  res.locals.snippets = []
  getSnippet = function(url, index) {
    try {
      http.get(url, function httpResHandler(response) {
        var previousResp = res
        response.setEncoding('utf8')
        var collectHtml = ''
        response.on('data', function dataHandler(body) {
          collectHtml += body;
        })
        response.on('end', function handler() {
          var snippetItem = {
            clickurl: url
            , dispurl: getDispUrl(previousResp.locals.bossdata[index].dispurl)
            , snippet: snippetFromHtml(url, collectHtml)
          }
          previousResp.locals.snippets[count] = snippetItem
          count+=1
          if (count == 7) { 
            next()
          }
        })
        
      })
    } catch (err) {
      console.log('**ERR*********************')
      console.log(err)
      console.log(err.stack)
      console.log('**END*********************')
    }
  }
  for (var i = 0; i < data.length; i++) { getSnippet(data[i].clickurl, i) }
}


var endpoint = function(req, res) {
  res.render('search/index', {results:testresults} )
}






exports.search = [getBossResults, parseResults, endpoint]//getBossResults, parseResults, endpoint]




