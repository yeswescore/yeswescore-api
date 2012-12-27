var assert = require("assert")
  , http = require("http")
  , Conf = require("../conf.js");

describe('games', function(){
  describe('read', function(){
    it('GET should return 200 OK', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.games"]
      };
      
      http.get(options, function (res) {
        assert.equal(res.statusCode, 200);
        done();
      }).on("error", function (e) { throw e });
    })
  })
})
