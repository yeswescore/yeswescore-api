var assert = require("../lib/assert.js")
  , http = require("../lib/http.js")
  , Conf = require("../lib/conf.js");

describe('clubs', function(){
  describe('http status', function(){
    it('GET should return 404', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.clubs"]
      };
      
      http.is404OK(options, done);
    });
  });
});

describe('players', function(){
  describe('http status', function(){
    it('GET should return 404', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      http.is404OK(options, done);
    });
  });
});

describe('games', function(){
  describe('http status', function(){
    it('GET should return 200 OK', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.games"]
      };
      
      http.is200OK(options, done);
    });
  });
  
  describe('read', function(){
    it('should give games (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.games"]
      };
      
      http.getJSON(options, function (games) {
        assert(Array.isArray(games), "games must be an array");
        assert(games.length > 0, "games cannot be empty");
        
        games.forEach(function (game) {
          assert.isGame(game);
        });
        done();
      });
    });
  });
  
  describe('read :id', function () {
    it('should give a game (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.games"]
      };
      
      http.getJSON(options, function (games) {
        assert(Array.isArray(games), "games must be an array");
        assert(games.length > 0, "games cannot be empty");
        
        var game = games[0];
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+game.id
        };
        http.getJSON(options, function (game) {
          assert.isGame(game);
          done();
        });
      });
    });
  });
});

