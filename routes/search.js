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
  return '\"' + query + '\"'
}

var getDispUrl = function(dispurl) {
  return dispurl.replace(/<\/?[^>]+(>|$)/g, "").split('/')[0]
}


var snippetFromHtml = function(url, rawhtml) {
  var snippet = ''
  var htmlparser = require('cheerio')
  $ = htmlparser.load(rawhtml)
  
  //the beginning of a painful day
  if (url.indexOf('tutorialspoint') > -1) {
    snippet = $('pre').first().text() + '\n'
    snippet += $('pre.tryit').text()
  } else {
    snippet = $('pre').first().text()
  }
  return snippet
}

//public



var getBossResults = function(req, res, next) {
  var i, query, variations, cbcount
  cbcount = 0
  query = sanitizeQuery(req.query.q )
  console.log(query)
  variations = [{q: query, options: {count: 10, sites:'tutorialspoint.com,stackoverflow.com'}}]
  res.locals.bossdata = []
  for (i = 0; i < variations.length; i++) {
    ;(function(resp, index) {
      ybClient.searchWeb(variations[index].q, variations[index].options, function(err,dataFound,response) {
        var results = JSON.parse(dataFound).bossresponse.web.results
        resp.locals.bossdata.push({data: results, url:variations[index].options.url})
        cbcount += 1
        if (cbcount >= variations.length) {
          next()
        }
      })
    })(res, i)
  }

  
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
            , dispurl: getDispUrl(previousResp.locals.bossdata[0].data[index].dispurl)
            , snippet: snippetFromHtml(url, collectHtml)
          }
          previousResp.locals.snippets[count] = snippetItem
          count+=1
          if (count == 4 ) { 
            next()
          }
        })
        
      })
    } catch (err) {
      //console.log('**ERR*********************')
      //console.log(err)
      //console.log(err.stack)
      //console.log('**END*********************')
    }
  }
  for (var i = 0; i < data[0].data.length; i++) { getSnippet(data[0].data[i].clickurl, i) }
}


var endpoint = function(req, res) {
  res.render('search/index', {results:testresults} )
}






exports.search = [getBossResults, parseResults, endpoint]//getBossResults, parseResults, endpoint]




