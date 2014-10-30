var YaBoss = require('yaboss')
var http = require('http')
var https = require('https')
var htmlparser = require('cheerio')


var ybClient = new YaBoss(process.env.YBOSS_KEY, process.env.YBOSS_SECRET)




//private

var sanitizeQuery = function(query) {
  return '\"' + query.split('+').join(' ') + '\"'
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
  } else if (url.indexOf('stackoverflow') > -1) {
    result.qnaQuestion = $('.question-hyperlink').first().text().trim()
    result.qnaSnippet = $('.answercell').first().find('pre').last().text().trim()

  } else if (url.indexOf('pythonarticles') > -1) {
    result.gsnippet = $('.syntax').eq(0).find('pre').text()
    result.gsnippet += '\n'
    result.gsnippet += $('.syntax').eq(1).find('pre').text()
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



var getSnippet = function(url, index, res, next, maxAttempts) {
  var protocol = (url.indexOf('https') > -1) ? https : http
  try {
    protocol.get(url, function httpResHandler(response) {
      response.setEncoding('utf8')
      var collectHtml = ''
      response.on('data', function dataHandler(body) {
        collectHtml += body;
      })
      response.on('end', function handler() {
        res.locals.attempts += 1
        console.log(res.locals.attempts)
        var info = parseInfoFromHtml(url, collectHtml)
        if (info != null) {
          var snippetItem = {
            clickurl: url
            , dispurl: getDispUrl(res.locals.bossdata[index].dispurl)
            , info: info
          }
          res.locals.snippets[index] = snippetItem
          
        }
        if (res.locals.attempts == maxAttempts) { 
          next()
        }
      })
    })
  } catch (err) {
    res.locals.attempts += 1
    if (res.locals.attempts == maxAttempts) { 
      next()
    }
    console.log('**ERR*********************')
    console.error(err)
    console.error(err.stack)
    console.log('**END*********************')
  }
}


//public



var getBossResults = function(req, res, next) {
  var i, query, variations, options
  res.locals.query = req.query.q
  query = sanitizeQuery(req.query.q )
  options = {count: 50, sites:'pythonarticles.com,tutorialspoint.com,python.org,xahlee.info,www.ibiblio.org/g2swap/byteofpython/read,python.eventscripts.com,www.diveintopython.net,www.python-course.eu'}
  ybClient.searchWeb(query, options, function(err,dataFound,response) {
    res.locals.bossdata = JSON.parse(dataFound).bossresponse.web.results
    if (res.locals.bossdata) {
      console.log(res.locals.bossdata)
      next()
    } else {
      ybClient.searchWeb(query, {count: 10} ,function(err,data,resp) {
        res.locals.bossdata = JSON.parse(data).bossresponse.web.results
        console.log(res.locals.bossdata)
        next()
      })
    }
  })

  
}

var getSnippets = function(req, res, next) {
  var data = res.locals.bossdata
  var snippets = []
  var count = 0
  res.locals.snippets = []
  res.locals.attempts = 0

  // decide on how many snippets you want from specific url
  console.log(data.length)
  for (var i = 0; i < data.length; i++) { 
    getSnippet(data[i].clickurl, i, res, next, data.length) 
  }
}


var reorderResults = function(req, res) {
  var numberOfEntries = function(snippetItem) {
    var count = 0
    for (key in snippetItem.info) { if (snippetItem.info[key]!= '') { count += 1 }}
    if (snippetItem.info.qnaQuestion != '' && snippetItem.info.qnaSnippet != '') { count -= 0.5 } 
    return count
  }
  for (var i = 0; i < res.locals.snippets.length; i++) {
    if (res.locals.snippets[i] == null) {         
      res.locals.snippets.splice(i, 1);
      i--;
    }
  }
  res.locals.snippets = res.locals.snippets.sort(function(a, b) {
    return numberOfEntries(b) - numberOfEntries(a)
  })
  res.render('search/index', res.locals )
}






exports.search = [getBossResults, getSnippets, reorderResults]




