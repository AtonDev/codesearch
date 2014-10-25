var YaBoss = require('yaboss')
var http = require('http')
var htmlparser = require('cheerio')


var ybClient = new YaBoss(process.env.YBOSS_KEY, process.env.YBOSS_SECRET)




//private

var sanitizeQuery = function(query) {
  return '\"' + query + '\"'
}

var getDispUrl = function(dispurl) {
  return dispurl.replace(/<\/?[^>]+(>|$)/g, "").split('/')[0]
}


var infoFromHtml = function(url, rawhtml) {
  var result = {description: '', syntax: '', example: '', gsnippet: '', qnaQuestion: '', qnaSnippet: ''}
  var headers
  $ = htmlparser.load(rawhtml)
  
  //the beginning of a painful day
  if (url.indexOf('tutorialspoint') > -1) {

    result.gsnippet = $('pre').first().text().trim()
    headers = $('#middlecol').find('h2')
    headers.each(function(i, header) {
      header = $(this)
      switch(header.text()) {
        case "Description":
          result.description = header.next('p').text().trim()
        case "Syntax":
          result.syntax = header.nextAll('pre').first().text().trim()
          result.gsnippet = ''
        case "Example":
          result.example = header.nextAll('pre').first().text().trim()
          result.gsnippet = ''
      }
    })
    console.log(result)
  } else if (url.indexOf('stackoverflow') > -1) {
    result.qnaQuestion = $('.question-hyperlink').first().text().trim()
    result.qnaSnippet = $('.answercell').first().find('pre').first().text().trim()

  } else {
    result.gsnippet = $('pre').first().text()
  }
  return result
}

//public



var getBossResults = function(req, res, next) {
  var i, query, variations, options
  res.locals.query = req.query.q
  query = sanitizeQuery(req.query.q )
  options = {count: 10, sites:'tutorialspoint.com,stackoverflow.com'}
  ybClient.searchWeb(query, options, function(err,dataFound,response) {
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
            , info: infoFromHtml(url, collectHtml)
          }
          previousResp.locals.snippets[count] = snippetItem
          count+=1
          if (count == 4 ) { 
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
  res.render('search/index', res.locals )
}






exports.search = [getBossResults, parseResults, endpoint]//getBossResults, parseResults, endpoint]




