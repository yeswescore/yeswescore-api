var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

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
          competition: false
        };
        http.post(options, newTeam, function (team) {
          assert.isTeam(team);
          
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