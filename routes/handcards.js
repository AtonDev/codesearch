module.exports = function(app) {
  var schema = app.get('schema')
  var handcards = {
    index: function(req, res, next) {
      schema.models.infocard.all(function handleInfocardsData(err, data) {
        var counter = 0
        if (err) {
          console.error(err.msg)
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
      var cardId = req.params.id
      schema.models.infocard.findOne({where: {id: cardId}}, function(err, data) {
        if (err) {
          console.error(err.msg)
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
          var keywords = req.body.cKeywords.split(/\s+/)
          card.assignToKeywords(keywords, function() {
            res.redirect('/handcards')
          })
        } else {
          console.error(err.msg)
          console.error(err.stack)
          res.redirect('/handcards/new')
        }
      })
        
      console.log(req.body)

    },
    edit: function(req, res, next) {
      var cardId = req.params.id
      res.render('handcards/edit', {title: 'edit', id: cardId})
    },
    update: function(req, res, next) {
      var cardId = req.params.id
      console.log(req.body)
      res.redirect('/handcards')
    },
    destroy: function(req, res, next) {
      var cardId = req.params.id
      res.redirect('/handcards')
      
    }
  }

  return handcards 
}

var formartDbCardAndAddToSnippets = function(card) {
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