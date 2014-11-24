module.exports = function (app) {
  var schema = app.get('schema')

  var Keyword = schema.define('keyword',{
    keyword: { type: String , unique: true, index: true}
  })


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
      if (!err){
        keyword.infocards.add(self, function(err) {
          if (err) {
            console.error(err.stack)
          }
          counter++
          if (counter == keywords.length) {
            callback()
          }
        })
      } else {
        console.error(err)
        console.error(err.stack)
      }
    }
    for (var i = keywords.length - 1; i >= 0; i--) {
      (function(index){
        Keyword.findOne({where: {keyword: keywords[index]}}, function(err, keyword) {
          if (keyword === null || keyword.keyword === null) {
            Keyword.create({keyword: keywords[index]}, handleKeywordCardAssociation)
          } else {
            handleKeywordCardAssociation(err, keyword)
          }
        })
      })(i)
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