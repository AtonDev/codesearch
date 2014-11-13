module.exports = function(app) {
 var card = require('./cards')(app)
 return {Card: card}
}