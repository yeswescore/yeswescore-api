var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../lib/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('documents', function(){
  describe('clubs', function(){
    it('clubs/random should return 200 OK, and be readable again', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      
      http.getJSON(options, function (club) {
        
      });
      
      http.get(options, function (res) {
        assert.equal(res.statusCode, 200);
        done();
      }).on("error", function (e) { throw e });
    })
  });
});
