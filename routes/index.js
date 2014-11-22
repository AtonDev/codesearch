exports.search = require('./search')

module.exports = function(app) {
 return {
  search: require('./search')(app), 
  handcards: require('./handcards')(app)
 }
}