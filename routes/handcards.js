module.exports = function(app) {
  var handcards = {
    schema: app.get('schema'),
    index: function(req, res, next) {
      res.render('handcards/index', {title: 'index'})
    },
    show: function(req, res, next) {
      var cardId = req.params.id
      res.render('handcards/show', {title: 'show', id: cardId})
    },
    new: function(req, res, next) {
      res.render('handcards/new', {title: 'new'})
    },
    create: function(req, res, next) {
      
    },
    edit: function(req, res, next) {
      var cardId = req.params.id
      res.render('handcards/edit', {title: 'edit', id: cardId})
    },
    update: function(req, res, next) {
      var cardId = req.params.id
    },
    destroy: function(req, res, next) {
      var cardId = req.params.id
      
    }
  }

  return handcards 
}