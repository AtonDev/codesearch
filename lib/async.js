// executes functions in callbacks in series in node.js
function series(callbacks, last) {
  var results = []
  function next() {
    var callback  = callbacks.shift()
    if (callback) {
      callback(function() {
        results.push(Array.prototype.slice.call(arguments))
        next()
      })
    } else {
      last(results)
    }
  }
  next()
}


// executes functions in callbacks concurrently
function parallel(callbacks, last) {
  var results = []
  var results_count = 0
  callbacks.forEach(function(callback, index){
    callback(function(){
      results.push(Array.prototype.slice.call(arguments))
      results_count++
      if (results_count == callbacks.length) {
        last(results)
      }
    })
  })
}


module.exports = {
  series: series,
  parallel: parallel
}