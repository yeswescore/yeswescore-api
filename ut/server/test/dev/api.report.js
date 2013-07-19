var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:report', function(){
  describe('read random club, then report it', function(){
    it('should report the club.', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub, "random club must exist");
        assert.isId(randomClub._id);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.report"]+"clubs/"+randomClub._id+"/"
        };
        http.getJSON(options, function (empty) {
          assert.isEmptyObject(empty);
          
          // let some time for mongo to write report
          setTimeout(function () {
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["documents.clubs"]+randomClub._id+"/"
            };
            
            http.getJSON(options, function (updatedClub) {
              assert.isObject(updatedClub, "updatedClub must exist");
              assert.isId(updatedClub._id, 'must be an id');
              assert(updatedClub._id == randomClub._id, 'must have same id');
              assert(updatedClub._reported == true, 'club must be reported');
              done();
            });
          }, 50);
        });
      });
    });
  });
  
  describe('read random player, then report it', function(){
    it('should report the player.', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer, "random player must exist");
        assert.isId(randomPlayer._id);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.report"]+"players/"+randomPlayer._id+"/"
        };
        http.getJSON(options, function (empty) {
          assert.isEmptyObject(empty);
          
          // let some time for mongo to write report
          setTimeout(function () {
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["documents.players"]+randomPlayer._id+"/"
            };
            
            http.getJSON(options, function (updatedPlayer) {
              assert.isObject(updatedPlayer, "updatedPlayer must exist");
              assert.isId(updatedPlayer._id, 'must be an id');
              assert(updatedPlayer._id == randomPlayer._id, 'must have same id');
              assert(updatedPlayer._reported == true, 'player must be reported');
              done();
            });
          }, 50);
        });
      });
    });
  });
  
  describe('read random game, then report it', function(){
    it('should report the game.', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      
      http.getJSON(options, function (randomGame) {
        assert.isObject(randomGame, "random game must exist");
        assert.isId(randomGame._id);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.report"]+"games/"+randomGame._id+"/"
        };
        http.getJSON(options, function (empty) {
          assert.isEmptyObject(empty);
          
          // let some time for mongo to write report
          setTimeout(function () {
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["documents.games"]+randomGame._id+"/"
            };
            
            http.getJSON(options, function (updatedGame) {
              assert.isObject(updatedGame, "updatedGame must exist");
              assert.isId(updatedGame._id, 'must be an id');
              assert(updatedGame._id == randomGame._id, 'must have same id');
              assert(updatedGame._reported == true, 'game must be reported');
              done();
            });
          }, 50);
        });
      });
    });
  });
  
  describe('read random game, add stream item, report it', function(){
    it('should report the stream item.', function (done){
      // read a game
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.games"]+"random"
      };
      http.getJSON(options, function (randomGame) {
        assert.isObject(randomGame, "random game must exist");
        
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
            assert.isStreamItem(s);
            assert.isId(s.id);
            
            // report the streamItem
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.report"]+"games/"+randomGame._id+"/stream/"+s.id+"/"
            };
            
            http.getJSON(options, function (empty) {
              assert.isEmptyObject(empty);
              
              // let some time for mongo to write report
              setTimeout(function () {
                // reading game from DB
                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: Conf["documents.games"]+randomGame._id
                };
                http.getJSON(options, function (game) {
                  assert(Array.isArray(game.stream), 'game.stream should be an array');
                  var streamItems = game.stream.filter(function (streamItem) {
                    return streamItem._id == s.id;
                  });
                  assert(streamItems.length === 1, 'should find the streamItem');
                  assert(streamItems[0]._reported === true, 'should be reported');
                  done();
                });
              }, 50);
            });
          });
        });
      });
    });
  });
});