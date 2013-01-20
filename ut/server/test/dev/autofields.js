var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");
// helpers
require('../../../../server/helpers.js');
  
if (Conf.env !== "DEV")
  process.exit(0);

describe('FIXME: autofields:club', function(){
  describe('update club name', function(){
    it('should give correct _searchableName', function (done) {
      done(/* FIXME */);
      // client cannot actualy update club name.
      //  so this feature is not yet implemented/testable
    });
  });
});

describe('autofields:player', function(){
  describe('update player nickname, name', function () {
    it('should update player._searchableNickame, _searchableName', function (done) {
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
        var name = "nickname"+now +rnd();
        
        var modifiedPlayer = {
          id: playerid,
          nickname: nickname,
          name: name
        };
        // saving
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+playerid+"/?playerid="+playerid+"&token="+randomPlayer.token
        };
        
        http.post(options, modifiedPlayer, function (player) {
          assert.isPlayerWithToken(player);
          assert(player.nickname === nickname, "must have same nickname");
          assert(player.name === name, "must have same name");
          
          // read from DB
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+playerid
          };
          http.getJSON(options, function (player) {
            assert.isPlayer(player);
            assert(player.nickname === nickname, "must have same nickname");
            assert(player.name === name, "must have same name");
            
            // read document from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["documents.players"]+playerid
            };
            
            http.getJSON(options, function (player) {
              assert(player.nickname === nickname, "must have same nickname");
              assert(player.name === name, "must have same name");
              assert(player._searchableNickname === nickname, "must have an updated searchable Nickname");
              assert(player._searchableName === name, "must have an updated searchable Name");
              
              done();
            });
          });
        });
      });
    });
  });
  
  describe('update player nickname, name', function () {
    it('should update player\'s games _searchablePlayersNickNames, _searchablePlayersNames', function (done) {
      // FIXME: MIGHT FAIL IF PLAYER OF THE GAME IS OWNED
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      
      http.getJSON(options, function (randomGame) {
        assert.isObject(randomGame);
        
        // extract player from this game
        var playerid = randomGame.teams[0].players[0];
        var gameid = randomGame._id;
        
        // reading randomPLayer documents
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+playerid
        };
        http.getJSON(options, function (randomPlayer) {
          assert.isObject(randomPlayer);
          //
          var now = new Date().getTime();
          var rnd = function () { return String(Math.round(Math.random() * 1000000)); }
          var nickname = "nickname"+now +rnd();
          var name = "nickname"+now +rnd();
          
          var modifiedPlayer = {
            id: playerid,
            nickname: nickname,
            name: name
          };
          // saving
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+playerid+"/?playerid="+playerid+"&token="+randomPlayer.token
          };
          
          http.post(options, modifiedPlayer, function (player) {
            assert.isPlayerWithToken(player);
            assert(player.nickname === nickname, "must have same nickname");
            assert(player.name === name, "must have same name");
            
            // read from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.players"]+playerid
            };
            http.getJSON(options, function (player) {
              assert.isPlayer(player);
              assert(player.nickname === nickname, "must have same nickname");
              assert(player.name === name, "must have same name");
              
              // read document from DB
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["documents.players"]+playerid
              };
              
              http.getJSON(options, function (player) {
                assert(player.nickname === nickname, "must have same nickname");
                assert(player.name === name, "must have same name");
                assert(player._searchableNickname === nickname, "must have an updated searchable Nickname");
                assert(player._searchableName === name, "must have an updated searchable Name");
                
                // check if game was updated
                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: Conf["documents.games"]+gameid
                };
                http.getJSON(options, function (game) {
                  assert.isObject(game, "game must be an object");
                  assert(game._searchablePlayersNickNames.indexOf(nickname) !== -1, "game _searchablePlayersNickNames must be updated");
                  assert(game._searchablePlayersNames.indexOf(name) !== -1, "game _searchablePlayersNames must be updated");
                  
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  
  describe('update player club', function () {
    it('should update player _searchableClubName', function (done) {
      // FIXME: MIGHT NOT BE PERTINENT IF RANDOM CLUB === current player club.
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub);

        var clubid = randomClub._id;

        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+"random"
        };
        http.getJSON(options, function (randomPlayer) {
          assert.isObject(randomPlayer);
          
          var playerid = randomPlayer._id;
          var modifiedPlayer = {
            id: playerid,
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
            assert(player.club.id === clubid, "must have same clubid (1)");
            
            // read from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.players"]+playerid
            };
            http.getJSON(options, function (player) {
              assert.isPlayer(player);
              assert(player.club.id === clubid, "must have same clubid (2)");
              
              // read document from DB
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["documents.players"]+playerid
              };
              
              http.getJSON(options, function (player) {
                assert(player.club.id === clubid, "must have same clubid (3)");
                assert(player._searchableClubName === randomClub.name.searchable(), "must have an updated searchable club name");
                
                done();
              });
            });
          });
        });
      });
    });
  });
  
  describe('update player club', function () {
    it('should update player\'s games _searchablePlayersClubsIds, _searchablePlayersClubsNames', function (done) {
      // FIXME: MIGHT FAIL IF PLAYER OF THE GAME IS OWNED
      // FIXME: MIGHT NOT BE PERTINENT IF RANDOM CLUB === current player club.
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub);
        
        var clubid = randomClub._id;
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.games"]+"random"
        };
        http.getJSON(options, function (randomGame) {
          assert.isObject(randomGame);
          
          // extract player from this game
          var playerid = randomGame.teams[0].players[0];
          var gameid = randomGame._id;
          
          // reading randomPLayer documents
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["documents.players"]+playerid
          };
          http.getJSON(options, function (randomPlayer) {
            assert.isObject(randomPlayer);
            //
            
            var modifiedPlayer = {
              id: playerid,
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
              assert(player.club.id === clubid, "must have same clubid (1)");
              
              // read from DB
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["api.players"]+playerid
              };
              http.getJSON(options, function (player) {
                assert.isPlayer(player);
                assert(player.club.id === clubid, "must have same clubid (2)");
                
                // read document from DB
                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: Conf["documents.players"]+playerid
                };
                
                http.getJSON(options, function (player) {
                  assert(player.club.id === clubid, "must have same clubid (3)");
                  
                  // check if game was updated
                  var options = {
                    host: Conf["http.host"],
                    port: Conf["http.port"],
                    path: Conf["documents.games"]+gameid
                  };
                  http.getJSON(options, function (game) {
                    assert.isObject(game, "game must be an object");
                    assert(game._searchablePlayersClubsIds.indexOf(clubid) !== -1, "game _searchablePlayersClubsIds must be updated");
                    assert(game._searchablePlayersClubsNames.indexOf(randomClub.name.searchable()) !== -1, "game _searchablePlayersClubsNames must be updated");
                    
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});