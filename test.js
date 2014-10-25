var fn = function(thing){
  fncb1(function cb1() {
    fncb2(function cb2() {
      console.log(thing)
    })
  })

}


var fncb1 = function(cb) {
  return cb()
}

var fncb2 = function(cb) {
  return cb()
}

fn('a')


