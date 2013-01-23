var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('documents', function(){
  describe('clubs', function(){
    it('clubs/random should return 200 OK, and be readable through api', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (club) {
        assert.isObject(club, "club must exist (be an object)");
        assert.isId(club._id);
        
        var clubid = club._id;
        options.path = Conf["api.clubs"]+clubid;
        http.getJSON(options, function (club) {
          assert.isObject(club, "club must exist (be an object)");
          assert.isId(club.id);
          assert(clubid === club.id);
          done();
        });
      });
    })
  });
  
  describe('players', function(){
    it('players/random should return 200 OK, and be readable through api', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      
      http.getJSON(options, function (player) {
        assert.isObject(player, "player must exist (be an object)");
        assert.isId(player._id);
        
        var playerid = player._id;
        options.path = Conf["api.players"]+playerid;
        http.getJSON(options, function (player) {
          assert.isObject(player, "player must exist (be an object)");
          assert.isId(player.id);
          assert(playerid === player.id);
          done();
        });
      });
    })
  });
  
  describe('games', function(){
    it('games/random should return 200 OK, and be readable through api', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      
      http.getJSON(options, function (game) {
        assert.isObject(game, "game must exist (be an object)");
        assert.isId(game._id);
        var gameid = game._id;
        options.path = Conf["api.games"]+gameid;
        http.getJSON(options, function (game) {
          assert.isObject(game, "game must exist (be an object)");
          assert.isId(game.id);
          assert(gameid === game.id);
          done();
        });
      });
    })
  });
});
