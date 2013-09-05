var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

var DB = {};
DB.toStringId = function (o) {
  if (typeof o === "string")
    return o;
  if (typeof o === "object" && o && o.id) // null is an object
    return DB.toStringId(o.id);
  if (typeof o === "object" && o && o._id) // null is an object
    return DB.toStringId(o._id);
  return null;
};

describe('dev:teams', function(){
  // READ
  describe('read random document team, then read api team should be a valid team', function(){
    it('should give team (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.teams"]+"random"
      };

      http.getJSON(options, function (randomTeam) {
        assert.isObject(randomTeam, "random team must exist");

        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.teams"]+randomTeam._id
        };
        http.getJSON(options, function (team) {
          assert.isTeam(team, "must be a team");
          assert(team.id === randomTeam._id, "must be same team");
          done();
        });
      });
    });
  });

  describe('create simpliest random team, read it', function() {
    it('should create the team', function (done) {
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
            path: Conf["api.teams"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
          };

          var newTeam = {
            sport : "tennis",
            name: "team-"+Math.random(),
            players: [ randomPlayer._id ],
            substitutes: [],
            competition: false,
            club: randomclub._id
          };
          http.post(options, newTeam, function (team) {
            assert.isTeam(team);

            // read it from DB.
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.teams"]+team.id
            };

            http.getJSON(options, function (team) {
              assert(team.name === newTeam.name, "should have same name");
              assert(team.sport == newTeam.sport, "should have same sport");
              assert(team.players.length === newTeam.players.length, "should have same number of players");
              assert(team.competition === newTeam.competition, "should be same competition bool");

              done();
            });
          });
        });
      });
    });
  });

  describe('create simpliest random team, modify it, read it', function() {
    it('should create the team & save it without errors', function (done) {
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
          path: Conf["api.teams"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };

        var newTeam = {
          sport : "tennis",
          name: "team-"+Math.random(),
          players: [ randomPlayer._id ],
          substitutes: [ randomPlayer._id ],
          captainSubstitute: randomPlayer._id, 
          competition: "false"
        };
        http.post(options, newTeam, function (team) {
          assert.isTeam(team);

          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["documents.players"]+"random"
          };
          http.getJSON(options, function (anotherRandomPlayer) {
            // modify it
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.teams"]+team.id+"/?playerid="+randomPlayer._id+"&token="+randomPlayer.token
            };

            var modifiedTeam = team;
            team.name = "team-"+Math.random();
            // add player
            team.players.push(anotherRandomPlayer._id);
            team.substitutes = [ anotherRandomPlayer._id ];
            team.captain = randomPlayer._id;
            team.captainSubstitute = ""; // try to empty this relationship.
            team.coach = anotherRandomPlayer._id;
            team.competition = "true";

            http.post(options, modifiedTeam, function (team) {
              assert(team.name === modifiedTeam.name, "should have same name");
              assert(team.sport == modifiedTeam.sport, "should have same sport");
              assert(team.players.length === modifiedTeam.players.length, "should have same number of players");
              assert(team.competition === true, "should be same competition bool");
              assert(DB.toStringId(team.captain) === DB.toStringId(randomPlayer), "should have good captain");
              assert(typeof team.captainSubstitute === "undefined", "should have no more captainSubstitute");
              assert(DB.toStringId(team.coach) === DB.toStringId(anotherRandomPlayer), "should have good coach");

              // read it from DB.
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["api.teams"]+team.id
              };

              http.getJSON(options, function (team) {
                assert(team.name === modifiedTeam.name, "should have same name");
                assert(team.sport == modifiedTeam.sport, "should have same sport");
                assert(team.players.length === modifiedTeam.players.length, "should have same number of players");
                assert(team.competition === true, "should be same competition bool");
                assert(DB.toStringId(team.captain.id) === DB.toStringId(randomPlayer), "should have good captain");
                assert(typeof team.captainSubstitute === "undefined", "should have no more captainSubstitute");
                assert(DB.toStringId(team.coach) === DB.toStringId(anotherRandomPlayer), "should have good coach");

                done();
              });
            });
          });
        });
      });
    });
  });


  var computeStreamCommentsSize = function (stream) {
    assert(Array.isArray(stream));

    var i, cpt = 0;
    for (i = 0; i < stream.length; ++i) {
      if (stream[i].type === "comment" &&
          stream[i]._deleted === false)
        cpt++;
    }
    return cpt;
  };

  describe('write a comment on a team stream', function () {
    it('should create team, create a comment, size of stream +1 (not empty & valid)', function (done){
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
          path: Conf["api.teams"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };

        var newTeam = {
          sport : "tennis",
          name: "team-"+Math.random(),
          players: [ randomPlayer._id ],
          substitutes: [ randomPlayer._id ],
          captainSubstitute: randomPlayer._id,
          competition: "false"
        };
        http.post(options, newTeam, function (team) {
          assert.isTeam(team);

          // nb Element ds le stream.
          var nbElementInStream = team.stream.length;

          // adding comment in team stream
          var streamObj = {
            type: "comment",
            data: { text : "test" }
          };
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.teams"]+team.id+"/stream/?playerid="+randomPlayer._id+"&token="+randomPlayer.token
          };
          http.post(options, streamObj, function (s) {
            assert.isStreamItem(s);
            
            // reading team from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.teams"]+team.id+"/stream/?limit=100000&playerid="+randomPlayer._id+"&token="+randomPlayer.token
            };
            http.getJSON(options, function (stream) {
              assert.isArray(stream);
              assert(stream.length === nbElementInStream + 1, "stream size should have grown by one");
              var streamItem = stream.shift();
              assert(streamItem.id == s.id, "stream first obj should be s");
              assert(streamItem.owner.player.id == randomPlayer._id, "should be the good player");
              assert(streamItem.owner.player.name === randomPlayer.name, "player name");

              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["documents.teams"]+team.id
              };
              http.getJSON(options, function (team) {
                assert.isObject(team, "team must exist");
                assert(computeStreamCommentsSize(team.stream) === team.streamCommentsSize, 'team stream length & streamCommentsSize should be the same (2) ' + team.stream.length + ' vs ' + team.streamCommentsSize);
                done();
              });
            });
          });
        });
      });
    });
  });
});