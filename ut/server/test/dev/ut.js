var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../lib/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('documents', function(){
  describe('clubs', function(){
    it('clubs/random should return 200 OK, and be readable throw api', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (club) {
        assert(club, "club must exist (be an object)");
        assert(typeof club.id === "string");
        options.path = Conf["api.clubs"]+club.id;
        var clubid = club.id;
        http.getJSON(options, function (club) {
          assert(club, "club must exist (be an object)");
          assert(typeof club.id === "string");
          assert(clubid === club.id);
          done();
        });
      });
    })
  });
  
  describe('players', function(){
    it('players/random should return 200 OK, and be readable throw api', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      
      http.getJSON(options, function (player) {
        assert(player, "player must exist (be an object)");
        assert(typeof player.id === "string");
        options.path = Conf["api.players"]+player.id;
        var playerid = player.id;
        http.getJSON(options, function (player) {
          assert(player, "player must exist (be an object)");
          assert(typeof player.id === "string");
          assert(playerid === player.id);
          done();
        });
      });
    })
  });
  
  describe('games', function(){
    it('games/random should return 200 OK, and be readable throw api', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      
      http.getJSON(options, function (game) {
        assert(game, "game must exist (be an object)");
        assert(typeof game.id === "string");
        options.path = Conf["api.games"]+game.id;
        var gameid = game.id;
        http.getJSON(options, function (game) {
          assert(game, "game must exist (be an object)");
          assert(typeof game.id === "string");
          assert(gameid === game.id);
          done();
        });
      });
    })
  });
});
