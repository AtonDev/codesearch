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


  Keyword.hasAndBelongsToMany('infocards')
  Infocard.hasAndBelongsToMany('keywords')

  Infocard.validatesPresenceOf('syntax', 'example', 'description', 'language')
  Infocard.validatesInclusionOf('language', {in: ['python']})
  Keyword.validatesPresenceOf('keyword')
  Keyword.validatesLengthOf('keyword', {min: 1, message: {min: 'Keyword needs at least 1 character'}})

  return {Keyword: Keyword, Infocard: Infocard} 
}