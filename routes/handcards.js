var SHA256 = require("crypto-js/sha256")
var crypto = require("crypto-js")
module.exports = function(app) {
  var schema = app.get('schema')
  var handcards = {
    index: function(req, res, next) {
      schema.models.infocard.all(function handleInfocardsData(err, data) {
        var counter = 0
        if (err) {
          
          consle.error(err.stack)
          res.end()
        }

        if (data.length === 0) {
          res.locals.title = 'index'
          res.render('handcards/index')
        } else {
          for (var i = data.length - 1; i >= 0; i--) {
            (function(index){
              data[index].keywords(function handleKeywordsData(err, keywordsdata) {
                if (keywordsdata) {
                  data[index]['myKeywords'] = keywordsdata.map(function handleKeywordObject(keywordObj){
                    return keywordObj.keyword
                  }).join(' ')
                }
                counter++
                if (counter == data.length) {
                  res.locals.cards = data
                  res.locals.title = 'index'
                  res.render('handcards/index')
                }
              })
            })(i)
          }
        }
      })
    },
    show: function(req, res, next) {
      schema.models.infocard.find(req.params.id, function(err, data) {
        if (err) {
          
          res.end()
        }
        res.locals.snippets = formartDbCardAndAddToSnippets(data)
        res.locals.title = 'show'
        res.render('handcards/show')
      })
    },
    new: function(req, res, next) {
      res.locals.title = 'new'
      res.render('handcards/new')
    },
    create: function(req, res, next) {
      var data = {
        syntax: req.body.syntax,
        example: req.body.example,
        sourceURL: req.body.sourceURL,
        description: req.body.description,
        language: req.body.language,
        priority: (req.body.priority == 'true'),
        date_updated: new Date().getTime()
      }
      schema.models.infocard.create(data, function(err, card) {
        if (!err) {
          var keywords = formatKeywords(req.body.cKeywords)
          card.assignToKeywords(keywords, function() {
            res.redirect('/handcards')
          })
        } else {
          console.error(err.stack)
          res.redirect('/handcards/new')
        }
      })
        

    },
    edit: function(req, res, next) {
      schema.models.infocard.find(req.params.id, function(err, data) {
        data.keywords(function handleKeywords(err, keywordsdata) {
          if (keywordsdata) {
            data['myKeywords'] = keywordsdata.map(function handleKeywordObject(keywordObj){
              return keywordObj.keyword
            }).join(' ')
          }
          res.locals.card = data
          res.locals.title = 'edit'
          res.render('handcards/edit')
        })
        if (err) {
          
          res.end()
        }
      })
    },
    update: function(req, res, next) {
      schema.models.infocard.find(req.params.id, function(err, card){
        card.updateAttributes(req.body, function(err, card){
          card.keywords(function removeAllKeywordsLinks(err, keywordsdata) {
            var counter = 0
            var keywords = formatKeywords(req.body.cKeywords)
            if (keywordsdata.length === 0) {
              card.assignToKeywords(keywords, function() {
                res.redirect('/handcards')
              })
            } else {
              for (var i = keywordsdata.length - 1; i >= 0; i--) {
                keywordsdata[i].infocards.remove(card, function(err) {
                  counter++
                  if (counter == keywordsdata.length) {
                    card.assignToKeywords(keywords, function() {
                      res.redirect('/handcards')
                    })
                  }
                })
              }
            }
          })
        })
      })
    },
    destroy: function(req, res, next) {
      schema.models.infocard.find(req.params.id, function(err, card){
        card.keywords(function removeAllKeywordsLinks(err, keywordsdata) {
          var counter = 0
          for (var i = keywordsdata.length - 1; i >= 0; i--) {
            keywordsdata[i].infocards.remove(card, function(err) {
              counter++
              if (counter == keywordsdata.length) {
                card.destroy(function(err){
                  res.redirect('/handcards')
                })
              }
            })
          }
        })
      })
    },
    newlogin: function(req, res, next) {
      return res.render('handcards/login')
    },
    login: function(req, res, next) {
      var password = SHA256(req.body.password).toString(crypto.enc.Hex).toUpperCase()
      console.log(password)
      if (password == '6936CD20441C12B99F04643BD5ECD00F942AEAF4463F6217C789333A08B7916D') {
        req.session.authenticated = true
        return res.redirect('/handcards')
      } else {
        return res.redirect('/admin/login')
      }

    },
    authenticate: function(req, res, next) {
      console.log(req.session)
      if (req.session && req.session.authenticated) {
        return next()
      } else {
        return res.redirect('/admin/login')
      }
    }
  }

  return handcards 
}

function formatKeywords(keywordsString) {
  return keywordsString.trim().split(/\s+/)
}

function formartDbCardAndAddToSnippets(card) {
  var result = []
  result.push({
    clickurl: card.sourceURL,
    dispurl: 'python.org',
    info: {
      syntax: card.syntax,
      example: card.example,
      description: card.description,
      qnaQuestion: '',
      qnaSnippet: ''
    },
    priority: card.priority,
    type: 'dbsnippet'
  })
  return result
}