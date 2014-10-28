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


var parseInfoFromHtml = function(url, rawhtml) {
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
    result.qnaSnippet = $('.answercell').first().find('pre').last().text().trim()

  } else if (url.indexOf('pythonarticles') > -1) {
    result.gsnippet = $('pre').first().text()
    result.gsnippet += $('pre').first().next('pre').text()
  } else {
    result.gsnippet = $('pre').first().text()
  }

  //check if some valid info were extracted
  var validResult = false
  for (key in result) {
    if (result[key] != '') {
      validResult = true
      break
    }
  }
  if (result.qnaQuestion != '' && result.qnaSnippet == '') {
    validResult = false
  }

  if (validResult) {
    return result
  } else {
    return null
  }
}

//public



var getBossResults = function(req, res, next) {
  var i, query, variations, options
  res.locals.query = req.query.q
  query = sanitizeQuery(req.query.q )
  options = {count: 10, sites:'pythonarticles.com,tutorialspoint.com,stackoverflow.com'}
  ybClient.searchWeb(query, options, function(err,dataFound,response) {
    res.locals.bossdata = JSON.parse(dataFound).bossresponse.web.results
    next()
  })
  

  
}

var getSnippets = function(req, res, next) {
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
          var info = parseInfoFromHtml(url, collectHtml)
          if (info != null) {
            var snippetItem = {
              clickurl: url
              , dispurl: getDispUrl(previousResp.locals.bossdata[index].dispurl)
              , info: info
            }

            previousResp.locals.snippets[count] = snippetItem
            count+=1
          }
            
          if (count == 4) { 
            next()
          }
        })
        
      })
    } catch (err) {
      console.log('**ERR*********************')
      console.log(err)
      console.log(url)
      //console.log(err.stack)
      console.log('**END*********************')
    }
  }

  // decide on how many snippets you want from specific url
  for (var i = 0; i < data.length; i++) { 
    getSnippet(data[i].clickurl, i) 
  }
}


var endpoint = function(req, res) {
  res.render('search/index', res.locals )
}






exports.search = [getBossResults, getSnippets, endpoint]//getBossResults, getSnippets, endpoint]




