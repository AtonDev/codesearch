module.exports = function (app) {
  var schema = app.get('schema')

  var Keyword = schema.define('keyword',{
    keyword: { type: String , unique: true, index: true}
  })

  // create new keyword if it does not exist
  Keyword.prototype.create = function(data, callback) {
    Keyword._super_.create(data, function(err, keyword) {
      if (!err) {
        callback(err, keyword)
      } else {
        Keyword.findOne({where: {keyword: data.keyword}}, function(err, keyword) {
          callback(err, keyword)
        })
      }
    }) 
  };

  var Infocard = schema.define('infocard', {
    syntax: { type: String },
    example: { type: String },
    description: { type: String },
    sourceURL: { type: String },
    language: { type: String },
    priority: { type: Boolean, default: false },
    date_updated: { type: Date }
  })

  Infocard.prototype.assignToKeywords = function assignToKeywords(keywords, callback) {
    var counter = 0
    var self = this
    var handleKeywordCardAssociation = function associationHandler(err, keyword) {
      keyword.infocards.add(self, function(err) {
        if (err) {
          console.error(err)
          console.error(err.stack)
        }
        counter++
        if (counter == keywords.length) {
          callback()
        }
      })
    }
    for (var i = keywords.length - 1; i >= 0; i--) {
      Keyword.create({keyword: keywords[i]}, handleKeywordCardAssociation)
    }
  }


  Keyword.hasAndBelongsToMany('infocards')
  Infocard.hasAndBelongsToMany('keywords')

  Infocard.validatesPresenceOf('syntax', 'example', 'description', 'language')
  Infocard.validatesInclusionOf('language', {in: ['python']})
  Keyword.validatesPresenceOf('keyword')
  Keyword.validatesLengthOf('keyword', {min: 1, message: {min: 'Keyword needs at least 1 character'}})

  return {Keyword: Keyword, Infocard: Infocard} 
}