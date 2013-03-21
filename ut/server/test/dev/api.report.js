var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:report', function(){
  describe('read random club, then report it', function(){
    it('should report the club.', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub, "random club must exist");
        assert.isId(randomClub._id);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.report"]+"clubs/"+randomClub._id+"/"
        };
        http.getJSON(options, function (empty) {
          assert.isEmptyObject(empty);
          
          // let some time for mongo to write report
          setTimeout(function () {
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["documents.clubs"]+randomClub._id+"/"
            };
            
            http.getJSON(options, function (updatedClub) {
              assert.isObject(updatedClub, "updatedClub must exist");
              assert.isId(updatedClub._id, 'must be an id');
              assert(updatedClub._id == randomClub._id, 'must have same id');
              assert(updatedClub._reported == true, 'club must be reported');
              done();
            });
          }, 200);
        });
      });
    });
  });
});