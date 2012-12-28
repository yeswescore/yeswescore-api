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
    });
  });
  
  describe('create basic player, then read it.', function () {
    it('should create the player (not empty & valid)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var newPlayer = {
        nickname : "TU-"+Math.random(),
        name: "TU-"+Math.random(),
        rank: "15/2",
        password: null,
        club: null
      };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        assert(newPlayer.nickname === player.nickname, "must have same nickname");
        assert(newPlayer.name === player.name, "must have same name");
        assert(newPlayer.rank === player.rank, "must have same rank");
        
        // verify player exist in DB.
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+player.id
        };
        http.getJSON(options, function (p) {
          assert.isPlayer(p, "must be a player");
          assert(p.id === player.id, "must be same player");
          done();
        });
      });
    });
  });
  
  describe('create player with club, then read it.', function () {
    it('should create the player (not empty & valid)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (randomClub) {
        assert.isClub(randomClub);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]
        };
        
        var newPlayer = {
          nickname : "TU-"+Math.random(),
          name: "TU-"+Math.random(),
          rank: "15/2",
          password: null,
          club: { id: randomClub.id, name: randomClub.name }
        };
        http.post(options, newPlayer, function (player) {
          assert.isPlayerWithToken(player);
          assert(newPlayer.nickname === player.nickname, "must have same nickname");
          assert(newPlayer.name === player.name, "must have same name");
          assert(newPlayer.rank === player.rank, "must have same rank");
          
          // verify player exist in DB.
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+player.id
          };
          http.getJSON(options, function (p) {
            assert.isPlayer(p, "must be a player");
            assert(p.id === player.id, "must be same player");
            assert.isObject(newPlayer.club, "newPlayer.club must be an object");
            assert(newPlayer.club.id === p.club.id, "must be same club");
            assert(newPlayer.club.name === p.club.name, "must have same club name");
            done();
          });
        });
      });
    });
  });
  
  describe('create player with club, then modify it.', function () {
    it('should create the player (not empty & valid)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (randomClub) {
        assert.isClub(randomClub);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]
        };
        
        var newPlayer = {
          nickname : "TU-"+Math.random(),
          name: "TU-"+Math.random(),
          rank: "15/2",
          password: null,
          club: { id: randomClub.id, name: randomClub.name }
        };
        http.post(options, newPlayer, function (player) {
          assert.isPlayerWithToken(player);
          assert(newPlayer.nickname === player.nickname, "must have same nickname");
          assert(newPlayer.name === player.name, "must have same name");
          assert(newPlayer.rank === player.rank, "must have same rank");
          
          // modify the player
          player.name = "foobar";
          // saving
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+player.id+"/?playerid="+player.id+"&token="+player.token
          };
          http.post(options, player, function (modifiedPlayer) {
            assert.isPlayerWithToken(modifiedPlayer, "must be a player");
            assert(modifiedPlayer.id === player.id, "must be same player");
            assert(modifiedPlayer.name === player.name, "must have the same modified name");
            
            // reading from DB
            http.getJSON(options, function (p) {
              assert.isPlayer(p, "must be a player");
              assert(p.id === player.id, "must be same player");
              assert(p.name === player.name, "must have the same modified name");
              done();
            });
          });
        });
      });
    });
  });
  
  describe('try to modify player without token', function () {
    it('should generate an unauthrorized error', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isPlayerWithToken(randomPlayer);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+randomPlayer.id
        };
        
        // modify player
        randomPlayer.name = "foobar";
        // try post without auth tokens
        http.post(options, randomPlayer, function (error) {
          assert.isError(error);
          assert(error.error === "unauthorized", "must be an unauthorized error");
          done();
        });
      });
    });
  });
  
  describe('try to modify other player (without good token)', function () {
    it('should generate an unauthrorized error', function (done) {
      // first, read a randomPlayer
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isPlayerWithToken(randomPlayer);

        // second, create a new player
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]
        };
        
        var newPlayer = {
          nickname : "TU-"+Math.random(),
          name: "TU-"+Math.random(),
          rank: "15/2",
          password: null,
          club: null
        };
        http.post(options, newPlayer, function (player) {
          assert.isPlayerWithToken(player);
          
          // third, new player try to modify randomPlayer
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+randomPlayer.id+"/?playerid="+player.id+"&token="+player.token
          };

          var i = 0;
          var cb = function () { i++; if (i == 2) done() };
          
          // try post
          http.post(options, player, function (error) {
            assert.isError(error);
            assert(error.error === "wrong format", "wrong format error");
            cb();
          });
          player.id = randomPlayer.id;
          http.post(options, player, function (error) {
            assert.isError(error);
            assert(error.error === "unauthorized", "unauthorized error");
            cb();
          });
        });
      });
    });
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
  
  describe('create a single game without info, then read it', function () {
    it('should create & give a game (not empty & valid)', function (done){
      // read a player
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isPlayerWithToken(randomPlayer);
      
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+"?playerid="+randomPlayer.id+"&token="+randomPlayer.token
        };
        
        var newGame = { };
        http.post(options, newGame, function (game) {
          assert.isGame(game);
          done();
        });
      });
    });
  });
  
  describe('create a single game, no teams, then read it', function () {
    it('should create & give the game (not empty & valid)', function (done){
      // read a player
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isPlayerWithToken(randomPlayer);
      
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+"?playerid="+randomPlayer.id+"&token="+randomPlayer.token
        };
        
        var newGame = {
          pos: { long: 42.4242, lat: 43.4343 },
          country: "FRANCE",
          city: "marck",
          type: "singles",
          sets: "0/0",
          score: "0/0",
          status: "ongoing"
        };
        http.post(options, newGame, function (game) {
          assert.isGame(game);
          assert(game.pos.long === newGame.pos.long, "long should be the same");
          assert(game.pos.lat === newGame.pos.lat, "lat should be the same");
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
  
  describe('create a single game between 2 teams of anonymous players, then read it', function () {
    it('should create & give the game (not empty & valid)', function (done){
      // read a player
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isPlayerWithToken(randomPlayer);
      
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.games"]+"?playerid="+randomPlayer.id+"&token="+randomPlayer.token
        };
        
        var newGame = {
          teams: [ { id: null, players: [ { name : "toto" } ] },
                   { id: null, players: [ { name : "titi" } ] } ]
        };
        http.post(options, newGame, function (game) {
          assert.isGame(game);
          assert(Array.isArray(game.teams) && game.teams.length === 2, "two teams");
          assert(game.teams[0].players[0].name === "toto", "first player is toto");
          assert(game.teams[1].players[0].name === "titi", "second player is titi");
          done();
        });
      });
    });
  });
});
