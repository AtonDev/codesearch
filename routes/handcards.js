module.exports = function(app) {
  var schema = app.get('schema')
  var handcards = {
    index: function(req, res, next) {
      schema.models.infocard.all(function handleInfocardsData(err, data) {
        var counter = 0
        if (err) {
          console.error(err.msg)
          res.end()
        }
        for (var i = data.length - 1; i >= 0; i--) {
          (function(index){
            schema.models.keyword.all({where: {infocardId: data[index].id}}, function handleKeywordsData(err, keywordsdata) {
              data[index]['myKeywords'] = keywordsdata.map(function handleKeywordObject(keywordObj){
                return keywordObj.keyword
              }).join(' ')
              console.log(data[index]['myKeywords'])
              counter++
              if (counter == data.length) {
                res.locals.cards = data
                res.locals.title = 'index'
                res.render('handcards/index')
              }
            })
          })(i) 
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
      console.log(req.body)
      res.render('handcards/index')
    },
    edit: function(req, res, next) {
      var cardId = req.params.id
      res.render('handcards/edit', {title: 'edit', id: cardId})
    },
    update: function(req, res, next) {
      var cardId = req.params.id
      console.log(req.body)
      res.render('handcards/index')
    },
    destroy: function(req, res, next) {
      var cardId = req.params.id
      res.render('handcards/index')
      
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