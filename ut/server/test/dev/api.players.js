var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

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
          path: Conf["api.players"]+randomplayer._id
        };
        http.getJSON(options, function (player) {
          assert.isPlayer(player, "must be a player");
          assert(player.id === randomplayer._id, "must be same player");
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
        email: "marcd-"+Math.random()+"@zescore.com",
        idlicense: "TU-"+Math.random(),
        rank: "15/2",
        password: null,
        club: null
      };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        assert(newPlayer.nickname === player.nickname, "must have same nickname");
        assert(newPlayer.name === player.name, "must have same name");
        assert(newPlayer.rank === player.rank, "must have same rank");
        assert(newPlayer.email === player.email, "must have same email");
        assert(newPlayer.idlicense === player.idlicense, "must have same idlicense");
        
        // verify player exist in DB.
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+player.id
        };
        http.getJSON(options, function (p) {
          assert.isPlayer(p, "must be a player");
          assert(p.id === player.id, "must be same player");
          assert(p.nickname === player.nickname, "must have same nickname");
          assert(p.name === player.name, "must have same name");
          assert(p.rank === player.rank, "must have same rank");
          assert(p.email === player.email, "must have same email");
          assert(p.idlicense === player.idlicense, "must have same idlicense");
          done();
        });
      });
    });
  });
  
  describe('create basic player default values, then read it.', function () {
    it('should create the player (not empty & valid)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var newPlayer = { };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
          assert(player.nickname === "", "nickname should be empty string");
          assert(player.name === "", "name should be empty string");
          assert(player.rank === "", "rank should be empty string");
          assert(player.email === "", "email should be empty string");
          assert(player.idlicense === "", "idlicense should be empty string");
        
        // verify player exist in DB.
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+player.id
        };
        http.getJSON(options, function (p) {
          assert.isPlayer(p, "must be a player");
          assert(p.id === player.id, "must be same player");
          assert(p.nickname === "", "nickname should be empty string");
          assert(p.name === "", "name should be empty string");
          assert(p.rank === "", "rank should be empty string");
          assert(p.email === "", "email should be empty string");
          assert(p.idlicense === "", "idlicense should be empty string");
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
        assert.isObject(randomClub);
        assert.isId(randomClub._id);
        assert.isString(randomClub.name);
        
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
          club: { id: randomClub._id, name: randomClub.name }
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
        assert.isObject(randomClub);
        assert.isId(randomClub._id);
        assert.isString(randomClub.name);
        
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
          club: { id: randomClub._id, name: randomClub.name }
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
            
            // reading from DB authentified
            http.getJSON(options, function (p) {
              assert.isPlayerWithToken(p, "must be a player");
              assert(p.id === player.id, "must be same player");
              assert(p.name === player.name, "must have the same modified name");
              
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["api.players"]+player.id
              };
              // reading from DB unauthentified
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
  });
  
  describe('try to modify player without token', function () {
    it('should generate an unauthrorized error', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer);
        assert.isId(randomPlayer._id);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+randomPlayer._id
        };
        
        // modify player
        randomPlayer.name = "foobar";
        // try post without auth tokens
        http.post(options, randomPlayer, function (error) {
          assert.isError(error);
          assert(error.error === "id differs", "must be an unauthorized error");
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
        assert.isObject(randomPlayer);
        assert.isId(randomPlayer._id);

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
            path: Conf["api.players"]+randomPlayer._id+"/?playerid="+player.id+"&token="+player.token
          };

          var i = 0;
          var cb = function () { i++; if (i == 2) done() };
          
          // try post
          http.post(options, player, function (error) {
            assert.isError(error);
            assert(error.error === "id differs", "wrong format error");
            cb();
          });
          player.id = randomPlayer.id;
          http.post(options, player, function (error) {
            assert.isError(error);
            assert(error.error === "id differs", "unauthorized error");
            cb();
          });
        });
      });
    });
  });
  
  describe('update a player (name,nickname,rank,password,club)', function () {
    it('should modify the player (name,nickname,rank,password,club)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub);
        assert.isId(randomClub._id);
        assert.isString(randomClub.name);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+"random"
        };
        http.getJSON(options, function (randomPlayer) {
          assert.isObject(randomPlayer);
          assert.isId(randomPlayer._id);
          
          var playerid = randomPlayer._id;
          var now = new Date().getTime();
          var rnd = function () { return String(Math.round(Math.random() * 1000000)); }
          var nickname = "nickname"+now +rnd();
          var name = "name"+now +rnd();
          var rank = "rank"+now +rnd();
          var password = "password"+now +rnd();
          var clubid = randomClub._id;
          
          var modifiedPlayer = {
            id: playerid,
            name: name,
            nickname: nickname,
            rank: rank,
            password: password,
            club: { id: clubid }
          };
          // saving
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+playerid+"/?playerid="+playerid+"&token="+randomPlayer.token
          };
          
          http.post(options, modifiedPlayer, function (player) {
            assert.isPlayerWithToken(player);
            assert(modifiedPlayer.name === player.name, "must have same name");
            assert(modifiedPlayer.nickname === player.nickname, "must have same nickname");
            assert(modifiedPlayer.rank === player.rank, "must have same rank");
            assert(modifiedPlayer.club.id === player.club.id, "must have same club");
            // the password shouldn't be the same !
            assert(modifiedPlayer.password !== player.password, "must have different password");
            
            // read from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.players"]+playerid
            };
            http.getJSON(options, function (player) {
              assert.isPlayer(player);
              assert(modifiedPlayer.name === player.name, "must have same name");
              assert(modifiedPlayer.nickname === player.nickname, "must have same nickname");
              assert(modifiedPlayer.rank === player.rank, "must have same rank");
              assert(modifiedPlayer.club.id === player.club.id, "must have same club");
              
              done();
            });
          });
        });
      });
    });
  });
  
  describe('FIXME: read players filtering by club', function() {
    it('should read player checking params: security, pregQuote, ...', function (done) {
      done(/* FIXME */);
    });
  });
  
  describe('FIXME: read players filtering by club', function() {
    it('should read players using filter ?club=:id', function (done) {
      done(/* FIXME */);
    });
  });
});