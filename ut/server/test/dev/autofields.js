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
  describe('update game city', function () {
    it('should update game._searchableCity', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      
      http.getJSON(options, function (randomGame) {
        assert.isObject(randomGame, "should be an object");
        assert.isId(randomGame._id, "should be an id");
        
        // read game owner
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+randomGame.owner
        };
        http.getJSON(options, function (owner) {
          assert.isObject(owner);
          assert.isId(owner._id);
          
          // update the game
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.games"]+randomGame._id+"/?playerid="+owner._id+"&token="+owner.token
          };
          
          var cityName = "city"+Math.round(Math.random()*10000);
          http.post(options, { location: { city: cityName } }, function (game) {
            assert.isObject(game);
            assert.isId(game.id, "game shoud have an id");
            assert(game.location.city === cityName, "city should have been updated");
            
            // searching 
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.games"]+"?q="+cityName
            };
            http.getJSON(options, function (games) {
              assert(Array.isArray(games), "games should be an array");
              assert(games.length === 1, "should have found the game !");
              
              done();
            });
          });
        });
      });
    });
  });
  
  describe('update player name (1)', function () {
    it('should update _searchableName', function (done) {
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
        var name = "test"+Math.random();
        
        var modifiedPlayer = {
          id: playerid,
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
          assert(player.name === name, "must have same name");
          
          // read from DB
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+playerid
          };
          http.getJSON(options, function (player) {
            assert.isPlayer(player);
            assert(player.name === name, "must have same name");
            
            // read document from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["documents.players"]+playerid
            };
            
            http.getJSON(options, function (player) {
              assert(player.name === name, "must have same name");
              assert(player._searchableName === name, "must have an updated searchable Name");
              
              done();
            });
          });
        });
      });
    });
  });
  
  describe('update player name (2)', function () {
    it('should update player\'s games _searchablePlayersNames', function (done) {
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
          var name = "test"+Math.random();
          
          var modifiedPlayer = {
            id: playerid,
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
            assert(player.name === name, "must have same name");
            
            // read from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.players"]+playerid
            };
            http.getJSON(options, function (player) {
              assert.isPlayer(player);
              assert(player.name === name, "must have same name");
              
              // read document from DB
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["documents.players"]+playerid
              };
              
              http.getJSON(options, function (player) {
                assert(player.name === name, "must have same name");
                assert(player._searchableName === name, "must have an updated searchable Name");
                
                // check if game was updated
                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: Conf["documents.games"]+gameid
                };
                http.getJSON(options, function (game) {
                  assert.isObject(game, "game must be an object");
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
  
  describe('update player club (1)', function () {
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
  
  describe('update player club (2)', function () {
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
            //if (randomPlayer.club && randomPlayer.club.id) {
            //  console.log('player alread has a club id = ' + randomPlayer.club.id);
            //}
            //console.log('modifying player with clubid = ' + clubid);
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
  
  describe('create a game', function () {
    it('should update _searchable fields ', function (done) {  
      // read a club => read a player (document & object) => update player with club
      //  => create a game with player as owner & player
      //  => check searchable fields in the game.
      
      // read a club.
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (randomClub) {
        // read a player document
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+"random"
        };        
        http.getJSON(options, function (randomPlayer) {
          assert.isObject(randomPlayer, "random player must exist");
          // read a player normal object
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+randomPlayer._id
          };
          http.getJSON(options, function (p) {
            assert.isPlayer(p, "must be a player");
            // assign club to player.
            p.club = { id: randomClub._id, name: randomClub.name };
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.players"]+p.id+"/?playerid="+p.id+"&token="+randomPlayer.token
            };
            // save.
            http.post(options, p, function (player) {
              assert.isPlayerWithToken(player);
              // re-read player document...
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["documents.players"]+player.id
              };        
              http.getJSON(options, function (randomPlayer) {
                assert.isObject(randomPlayer, "random player must exist");
                
                // create a game
                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: Conf["api.games"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
                };
                
                var newGame = {
                  infos: { score: "0/0" },
                  teams: [ { id: null, players: [ { id: randomPlayer._id, name : randomPlayer.name } ] },
                          { id: null, players: [ { name : "titi" } ] } ]
                };
            
                http.post(options, newGame, function (game) {
                  assert.isGame(game);
                  assert(game.teams[0].players[0].id == randomPlayer._id);
                  assert(game.teams[0].players[0].name == randomPlayer.name);
                  
                  // read game document
                  var options = {
                    host: Conf["http.host"],
                    port: Conf["http.port"],
                    path: Conf["documents.games"]+game.id
                  };
                  http.getJSON(options, function (docGame) {
                    assert.isObject(docGame, "random game must exist");
                    // console.log(docGame._searchablePlayersClubsNames, randomPlayer._searchableClubName);
                    // console.log(docGame._searchablePlayersNames, randomPlayer._searchableName);
                    assert(docGame._searchablePlayersClubsNames.indexOf(randomPlayer._searchableClubName) !== -1, "searchable players clubs names");
                    assert(docGame._searchablePlayersNames.indexOf(randomPlayer._searchableName) !== -1, "searchable players names");
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
  
  describe('update game player', function () {
    it('should update player.games ', function (done) {
      // FIXME: MIGHT NOT BE PERTINENT IF RANDOM GAME === current player game.
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      http.getJSON(options, function (randomGame) {
        assert.isObject(randomGame);
        var gameid = randomGame._id;
        //
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+randomGame.owner
        };
        http.getJSON(options, function (owner) {
          var ownerid = owner._id;
          var ownertoken = owner.token;
          //
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["documents.players"]+"random"
          };
          http.getJSON(options, function (randomPlayer) {
            assert.isObject(randomPlayer);
            
            // extract player from this game
            var playerid = randomPlayer._id;
            var oldPlayerid = randomGame.teams[0].players[0];
            
            // modifying game
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.games"]+gameid+"/?playerid="+ownerid+"&token="+ownertoken
            };
            var modifiedGame = {
              id: gameid,
              teams: [
                { players: [ playerid ] },
                { players: [ randomGame.teams[1].players[0] ] }
              ]
            };
            
            http.post(options, modifiedGame, function (game) {
              assert.isObject(game, "must be a game");
              assert(game.teams[0].players[0].id == playerid, "team must be updated ("+
                game.teams[0].players[0].id+" vs "+playerid+")"
              );
              
              // checking player.games
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["api.players"]+playerid
              };
              http.getJSON(options, function (player) {
                assert(player.games.indexOf(gameid) !== -1, "player must be linked to new game");
              
                // now, changing back playerid
                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: Conf["api.games"]+gameid+"/?playerid="+ownerid+"&token="+ownertoken
                };
                var modifiedGame = {
                  id: gameid,
                  teams: [
                    { players: [ oldPlayerid ] },
                    { players: [ randomGame.teams[1].players[0] ] }
                  ]
                };
                
                http.post(options, modifiedGame, function (game) {
                  assert.isObject(game, "must be a game");
                  assert(game.teams[0].players[0].id == oldPlayerid, "team must be updated (2) ("+
                    game.teams[0].players[0].id+" vs "+oldPlayerid+")"
                  );
                  
                  // checking player.games
                  var options = {
                    host: Conf["http.host"],
                    port: Conf["http.port"],
                    path: Conf["api.players"]+playerid
                  };
                  http.getJSON(options, function (player) {
                    assert(player.games.indexOf(gameid) === -1, "player must be unlinked from new game");
                  
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
  
  describe('update game player', function () {
    it('should update player.games ', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      http.getJSON(options, function (randomGame) {
        assert.isObject(randomGame);
        var gameid = randomGame._id;
        //
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+randomGame.owner
        };
        http.getJSON(options, function (owner) {
          assert.isObject(owner);
          
          var ownerid = owner._id;
          var ownertoken = owner.token;
          
          var modifiedGame = {
            id: randomGame._id,
            teams: [
              { points: "4242" },
              { points: "4242" }
            ]
          };
          
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.games"]+gameid+"/?playerid="+ownerid+"&token="+ownertoken
          };
          http.post(options, modifiedGame, function (game) {
            assert.isObject(game, "must be a game");
            
            done();
          });
        });
      });
    });
  });
});