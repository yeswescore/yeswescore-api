var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../lib/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:clubs', function(){
  describe('read random document club, then read api club should be a valid club', function(){
    it('should give club (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      
      http.getJSON(options, function (randomclub) {
        assert.isObject(randomclub, "random club must exist");
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.clubs"]+randomclub.id
        };
        http.getJSON(options, function (club) {
          assert.isClub(club, "must be a club");
          assert(club.id === randomclub.id, "must be same club");
          done();
        });
      });
    })
  });
});

describe('dev:players', function(){
  describe('read random document player, then read api player should be a valid player', function(){
    it('should give player (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      
      http.getJSON(options, function (randomplayer) {
        assert.isObject(randomplayer, "random player must exist");
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+randomplayer.id
        };
        http.getJSON(options, function (player) {
          assert.isPlayer(player, "must be a player");
          assert(player.id === randomplayer.id, "must be same player");
          done();
        });
      });
    })
  });
});

describe('dev:games', function(){
  describe('read random document game, then read api game should be a valid game', function(){
    it('should give game (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      
      http.getJSON(options, function (randomgame) {
        assert.isObject(randomgame, "random game must exist");
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+randomgame.id
        };
        http.getJSON(options, function (game) {
          assert.isGame(game, "must be a game");
          assert(game.id === randomgame.id, "must be same game");
          done();
        });
      });
    })
  });
});
