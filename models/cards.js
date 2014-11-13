module.exports = function (app) {
  var schema = app.get('schema')

  var Keyword = schema.define('keyword',{
    keyword: { type: String , unique: true, index: true}
  })

  var Infocard = schema.define('infocard', {
    syntax: { type: String },
    example: { type: String },
    descritpion: { type: String },
    sourceURL: { type: String },
    language: { type: String },
    date_updated: { type: Date }
  })


  Keyword.hasAndBelongsToMany('infocards')


  return {Keyword: Keyword, Infocard: Infocard} 
}