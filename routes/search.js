var YaBoss = require('yaboss')
var http = require('http')
var https = require('https')
var htmlparser = require('cheerio')


var ybClient = new YaBoss(process.env.YBOSS_KEY, process.env.YBOSS_SECRET)



// PHASE 1: get the collection of urls to extract the info from

/** Saves the results received by boss in res.locals.bossdata
 *  to be processed by the next middle ware function.
 *  @param {express.Request} req - the request object
 *  @param {express.Response} res - the response object
 *  @param {callback} next - a reference to the next middleware function
 */

var getBossResults = function(req, res, next) {
  var query, options, cbCount, data1 = [], data2 = []
  query = sanitizeQuery(req.query.q )
  options = {count: 10, sites:'stackoverflow.com,pythonarticles.com,tutorialspoint.com,python.org,xahlee.info,www.ibiblio.org/g2swap/byteofpython/read,python.eventscripts.com,www.diveintopython.net,www.python-course.eu'}
  cbCount = 0

  ybClient.searchWeb(query, options, function(err,dataFound,response) {
    data1 = JSON.parse(dataFound).bossresponse.web.results || []
    removeUnwantedURLs(data1)
    cbCount += 1
    if (data1.length > 9) {
      cbCount -= 1
      res.locals.bossdata = data1
      next()
    } else if (cbCount == 2) {
      res.locals.bossdata = data1.concat(data2)
      next()
    }
  })

  ybClient.searchWeb(query, {count: 10} ,function(err,dataFound,resp) {
    data2 = JSON.parse(dataFound).bossresponse.web.results || []
    cbCount += 1
    if (cbCount == 2) {
      res.locals.bossdata = data1.concat(data2)
      next()
    }
  })
}

/** Returns the sanitized query to be added to the boss API call. 
 *  @param {string} query - the query to be sanitized.
 *  @returns string the sanitized query to be used for the boss api call.
*/
var sanitizeQuery = function(query) {
  return query.split('+').join(' ')
}


// PHASE 2: extract info from each url


var getSnippets = function(req, res, next) {
  var data = res.locals.bossdata
  var snippets = []

  res.locals.snippets = []
  res.locals.attempts = 0

  data = removeDuplicateElement(data)
  removeUnwantedURLs(data)
  console.log('data: ' + data.length)

  for (var i = 0; i < data.length; i++) {
    getSnippet(data[i].clickurl, i, res, next, data.length) 
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
        var info = parseInfoFromHtml(url, collectHtml)
        if (info !== null) {
          var snippetItem = {
            clickurl: url,
            dispurl: getDispUrl(res.locals.bossdata[index].dispurl),
            info: info,
            type: 'snippet'
          }
          res.locals.snippets[index] = snippetItem   
        } else {
          var item = {
            clickurl: url,
            dispurl: getDispUrl(res.locals.bossdata[index].dispurl),
            abstract: res.locals.bossdata[index].abstract,
            title: res.locals.bossdata[index].title,
            type: 'normal'
          }
          res.locals.snippets[index] = item
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

var getDispUrl = function(dispurl) {
  return dispurl.replace(/<\/?[^>]+(>|$)/g, "")
}

var parseInfoFromHtml = function(url, rawhtml) {
  var result = {description: '', syntax: '', example: '', gsnippet: '', qnaQuestion: '', qnaSnippet: ''}
  var headers
  $ = htmlparser.load(rawhtml)
  
  if (url.indexOf('tutorialspoint') > -1) {
    result.gsnippet = $('pre').first().text().trim()
    headers = $('#middlecol').find('h2')
    headers.each(function(i, header) {
      header = $(this)
      switch(header.text()) {
        case "Description":
          result.description = header.next('p').text().trim()
          break
        case "Syntax":
          result.syntax = header.nextAll('pre').first().text().trim()
          result.gsnippet = ''
          break
        case "Example":
          result.example = header.nextAll('pre').first().text().trim()
          result.gsnippet = ''
          break
      }
    })
  } else if (url.indexOf('stackoverflow') > -1) {
    result.qnaQuestion = $('.question-hyperlink').first().text().trim()
    result.qnaSnippet = $('.answercell').first().find('pre').last().text().trim()

  } else if (url.indexOf('pythonarticles') > -1) {
    result.gsnippet = $('.syntax').eq(0).find('pre').text().trim()
    result.gsnippet += '\n'
    result.gsnippet += $('.syntax').eq(1).find('pre').text().trim()
  } else {
    result.gsnippet = $('pre').first().text().trim()
    if (result.gsnippet.indexOf('>>>') > -1) {
      result.example = result.gsnippet
      result.gsnippet = ''
    }
    if (url.indexOf('mail.python.org') > -1) {
      result.gsnippet = ''
    }
  }

  //check if some valid info were extracted
  var validResult = false
  for (var key in result) {
    if (result[key] !== '') {
      validResult = true
      break
    }
  }
  if (result.qnaQuestion !== '' && result.qnaSnippet === '') {
    validResult = false
  }

  if (validResult) {
    return result
  } else {
    return null
  }
}

var removeDuplicateElement = function(array) {
  if (array) {
    var newArray = [];
    label:for(var i = 0; i < array.length; i++ ) {  
      for(var j = 0; j < newArray.length; j++ ) {
        if(newArray[j].url == array[i].url) 
          continue label
      }
      newArray[newArray.length] = array[i];
    }
    return newArray;
  }
}

var removeUnwantedURLs = function(data) {
  var stackoverflowCount = 0
  var tutorialspointCount = 0
  if (data) {
    //decide on number of results for specific pages
    for (var i = 0; i < data.length; i++) {
      if (data[i].clickurl.indexOf('stackoverflow') > -1) {
        stackoverflowCount += 1
        if (stackoverflowCount > 2) {
          data.splice(i, 1)
          i--
        }
      } else if (data[i].clickurl.indexOf('tutorialspoint') > -1) {
        tutorialspointCount += 1
        if (tutorialspointCount > 3) {
          data.splice(i, 1)
          i--
        }
      }
    }
  }
}

//PHASE 3: reorder results and remove unwanted snippets

var reorderResults = function(req, res) {
  res.locals.query = req.query.q
  reIndexResults(res)
  removeUnwantedSnippets(res)
  res.render('search/index', res.locals )
}


var removeUnwantedSnippets = function(res) {
  for (var i = 0; i < res.locals.snippets.length; i++) {
    if (res.locals.snippets[i] === null) {         
      res.locals.snippets.splice(i, 1);
      i--;
    }
  }
}

var reIndexResults = function(res) {
  var itemScore = function(snippetItem) {
    var score = 0
    if (snippetItem.type == 'snippet') {
      score += 5
      for (var key in snippetItem.info) { 
        if (snippetItem.info[key]!== '') { 
          score += 1 
        } 
      }
      if (snippetItem.info.qnaQuestion !== '' && snippetItem.info.qnaSnippet !== '') { 
        score -= 0.5 
      } 
      if (snippetItem.info.gsnippet !== '') { 
        score -= 0.1 
      }
    }
    return score
  }
  res.locals.snippets = res.locals.snippets.sort(function(a, b) {
    return itemScore(b) - itemScore(a)
  })
}

exports.search = [getBossResults, getSnippets, reorderResults]




