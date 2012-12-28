var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../lib/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('games', function(){
  describe('read', function(){
    it('should give games (not empty)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.games"]
      };
      
      http.getJSON(options, function (games) {
        assert(Array.isArray(games), "games must be an array");
        assert(games.length > 0, "games cannot be empty");
        //
        games.forEach(function (game) {
          assert.isGame(game);
        });
        done();
      });
    })
  });
});