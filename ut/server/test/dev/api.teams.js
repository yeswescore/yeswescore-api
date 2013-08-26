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
          assert.isClub(team, "must be a team");
          assert(team.id === randomTeam._id, "must be same team");
          done();
        });
      });
    });
  });
});