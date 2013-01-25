var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:games', function(){
  describe('read random document game, then read api game should be a valid game', function(){
    it('should give game (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      
      console.log(options);
      
      http.getJSON(options, function (randomgame) {
        assert.isObject(randomgame, "random game must exist");
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+randomgame._id
        };
        http.getJSON(options, function (game) {
          assert.isGame(game, "must be a game");
          assert(game.id === randomgame._id, "must be same game");
          done();
        });
      });
    });
  });
  
  describe('FIXME: test game query', function () {
    it ('should be able to query games using q=...', function (done) {
      done(/* FIXME */);
    });
  });
  
  describe('FIXME: test game query club', function () {
    it ('should be able to query games using club=...', function (done) {
      done(/* FIXME */);
    });
  });

  describe('FIXME: create a game with no teams', function () {
    it ('should be an error teams.players format', function (done) {
      done(/* FIXME */);
    });
  });
  
  describe('FIXME: create a game with teams & wrong player format', function () {
    it ('should be an error teams.players format', function (done) {
      done(/* FIXME */);
    });
  });
  
  describe('FIXME: create a game with teams & player with wrong id', function () {
    it ('should be an error teams.players not exist', function (done) {
      done(/* FIXME */);
    });
  });
  
  describe('FIXME: create a game with teams & player with wrong id', function () {
    it ('should be an error teams.players not exist', function (done) {
      done(/* FIXME */);
    });
  });
  
  describe('create a single game without info, without token', function () {
    it('should be an error', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.games"]
      };
      
      var newGame = { };
      http.post(options, newGame, function (error) {
        assert.isError(error);
        done();
      });
    });
  });
  
  describe('FIXME: create a single game without info, then read it', function () {
    it('should be an error missing team info', function (done){
      return done(); 
      // read a player
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer, "random player must exist");
      
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };
        
        var newGame = { /* missing teams info */  };
        http.post(options, newGame, function (error) {
          assert.isError(error, "missing info => creating game should end in error");
          assert(error.error === "teams format", "error should be 'teams format'");
          done();
        });
      });
    });
  });
  
  describe('create a single game between 2 teams of anonymous players, then read it', function () {
    it('should create & give the game (not empty & valid)', function (done){
      // read a player
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer, "random player must exist");
      
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };
        
        var newGame = {
          teams: [ { id: null, players: [ { name : "toto", nickname: "nick", email: "foo@zescore.com", rank: "15/2" } ] },
                   { id: null, players: [ { name : "titi" } ] } ]
        };
        http.post(options, newGame, function (game) {
          assert.isGame(game, "game was correctly created");
          assert(Array.isArray(game.teams) && game.teams.length === 2, "two teams");
          assert(game.teams[0].players[0].name === "toto", "first player is toto");
          assert(game.teams[1].players[0].name === "titi", "second player is titi");
          assert.isId(game.teams[0].players[0].id, "first player should have an id");
          assert.isId(game.teams[1].players[0].id, "second player should have an id");
          assert(game.teams[0].players[0].nickname === newGame.teams[0].players[0].nickname, "nick");
          assert(game.teams[0].players[0].email === newGame.teams[0].players[0].email, "email");
          assert(game.teams[0].players[0].rank === newGame.teams[0].players[0].rank, "rank");
          
          done();
        });
      });
    });
  });
  
  describe('create a single game between 2 teams of anonymous players, with clubs then read it', function () {
    it('should create & give the game (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      
      http.getJSON(options, function (randomclub) {
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+"random"
        };
        
        http.getJSON(options, function (randomPlayer) {
          assert.isObject(randomPlayer, "random player must exist");
        
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.games"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
          };
          var newGame = {
            teams: [ { id: null, players: [ { name : "toto", nickname: "nick", email: "foo@zescore.com", rank: "15/2" } ] },
                    { id: null, players: [ { name : "titi" , club: { id: randomclub._id } } ] } ]
          };
          http.post(options, newGame, function (game) {
            assert.isGame(game, "game was correctly created");
            assert(Array.isArray(game.teams) && game.teams.length === 2, "two teams");
            assert(game.teams[0].players[0].name === "toto", "first player is toto");
            assert(game.teams[1].players[0].name === "titi", "second player is titi");
            assert.isId(game.teams[0].players[0].id, "first player should have an id");
            assert.isId(game.teams[1].players[0].id, "second player should have an id");
            assert(game.teams[0].players[0].nickname === newGame.teams[0].players[0].nickname, "nick");
            assert(game.teams[0].players[0].email === newGame.teams[0].players[0].email, "email");
            assert(game.teams[0].players[0].rank === newGame.teams[0].players[0].rank, "rank");
            // tests on clubs
            assert(game.teams[1].players[0].club.id === randomclub._id, "club id");
            assert(game.teams[1].players[0].club.name === randomclub.name, "club name");
            
            done();
          });
        });
      });
    });
  });
  
  describe('create a single game, then read it', function () {
    it('should create & give the game (not empty & valid)', function (done){
      // read a player
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer, "random player must exist");
      
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };
        
        var newGame = {
          pos: [ 42.4242, 43.4343 ],
          country: "FRANCE",
          city: "marck",
          type: "singles",
          sets: "0/0",
          score: "0/0",
          status: "ongoing",
          teams: [ { id: null, players: [ { name : "toto" } ] },
                   { id: null, players: [ { name : "titi" } ] } ]
        };
        http.post(options, newGame, function (game) {
          assert.isGame(game);
          assert(game.pos[0] === newGame.pos[0], "long should be the same");
          assert(game.pos[1] === newGame.pos[1], "lat should be the same");
          assert(game.country === newGame.country, "country should be the same");
          assert(game.city === newGame.city, "city should be the same");
          assert(game.sets === newGame.sets, "sets should be the same");
          assert(game.score === newGame.score, "score should be the same");
          assert(game.status === newGame.status, "status should be the same");
          done();
        });
      });
    });
  });
  
  describe('create a single game, then modify it', function () {
    it('should create & give the game (not empty & valid)', function (done){
      // read a player
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer, "random player must exist");
      
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };
        
        var newGame = {
          score: "0/0",
          teams: [ { id: null, players: [ { name : "toto" } ] },
                   { id: null, players: [ { name : "titi" } ] } ]
        };
        http.post(options, newGame, function (game) {
          assert.isGame(game);
          assert(game.score === newGame.score, "score should be the same");

          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.games"]+game.id+"/?playerid="+randomPlayer._id+"&token="+randomPlayer.token
          };
          
          var newScore = "15/0";
          game.score = newScore;
          
          http.post(options, game, function (game) {
            assert.isGame(game);
            assert(game.score === newScore, "score should be updated");
            
            // reading the game from DB to be sure !
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.games"]+game.id
            };
            http.getJSON(options, function (g) {
              assert.isGame(g);
              assert(g.score === newScore, "score should be updated in DB");
              done();
            });
          });
        });
      });
    });
  });
  
  describe('write a comment on a stream', function () {
    it('should create a comment, size of stream +1 (not empty & valid)', function (done){
      // read a game
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      http.getJSON(options, function (randomGame) {
        assert.isObject(randomGame, "random game must exist");
        
        // nb Element ds le stream.
        var nbElementInStream = randomGame.stream.length;
        // request random player
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+"random"
        };
        http.getJSON(options, function (randomPlayer) {
          assert.isObject(randomPlayer, "random player must exist");
          // adding comment in game stream
          var streamObj = {
            type: "comment",
            data: { text : "test" }
          };
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.games"]+randomGame._id+"/stream/?playerid="+randomPlayer._id+"&token="+randomPlayer.token
          };
          http.post(options, streamObj, function (s) {
            assert.isStreamComment(s);
            // reading game from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.games"]+randomGame._id+"/?stream=true"
            };
            http.getJSON(options, function (game) {
              assert.isGame(game);
              assert(game.stream.length === nbElementInStream + 1, "stream size should have grown by one");
              assert(game.stream.pop().id === s.id, "stream last obj should be s");
              done();
            });
          });
        });
      });
    });
  });
});
