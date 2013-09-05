var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js")
  , Q = require("../../../../server/q.js");

var Shared = require('./shared.js');
var DB = Shared.DB;
var API = Shared.API;

describe('dev:teams', function(){
  // READ
  describe('read random document team, then read api team should be a valid team', function(){
    it('should give team (not empty & valid)', function (done){
      Q.wrap("c'est partiiii")
        .then(API.Team.random)
        .then(function map(randomTeam) { return randomTeam._id })
        .then(API.Team.read)
        .then(function () { done() });
    });
  });

  describe('create simpliest random team, read it', function() {
    it('should create the team', function (done) {
      var data = {}, newTeam;

      Q.wrap("c'est partiiii")
       .then(function () { return API.Club.random() }).inject(data, "randomClub")
       .then(function () { return API.Player.random() }).inject(data, "randomPlayer")
       .then(function () {
          var randomPlayer = data.randomPlayer;
          var randomClub = data.randomClub;
          newTeam = {
            sport : "tennis",
            name: "team-"+Math.random(),
            players: [ randomPlayer._id ],
            substitutes: [],
            competition: false,
            club: randomClub._id
          };
          return API.Team.create(newTeam, randomPlayer._id, randomPlayer.token)
        })
       .then(function (team) { return API.Team.read(team.id) })
       .then(function (team) {
          assert(team.name === newTeam.name, "should have same name");
          assert(team.sport == newTeam.sport, "should have same sport");
          assert(team.players.length === newTeam.players.length, "should have same number of players");
          assert(team.competition === newTeam.competition, "should be same competition bool");
       }).then(
         function () { done() },
         function (err) { done(err) }
       );
    });
  });

  describe('create simpliest random team, modify it, read it', function() {
    it('should create the team & save it without errors', function (done) {
      var data = {}, modifiedTeam;

      Q.wrap("c'est partiiii")
       .then(function () { return API.Player.random() }).inject(data, "randomPlayer")
       .then(function () { return API.Player.random() }).inject(data, "anotherRandomPlayer")
       .then(function () {
          // CREATION TEAM
          var randomPlayer = data.randomPlayer;
          var newTeam = {
            sport : "tennis",
            name: "team-"+Math.random(),
            players: [ randomPlayer._id ],
            substitutes: [ randomPlayer._id ],
            captainSubstitute: randomPlayer._id,
            competition: "false"
          };
          return API.Team.create(newTeam, randomPlayer._id, randomPlayer.token)
        }).then(function (team) {
          // MODIFICATION DE LA TEAM
          var randomPlayer = data.randomPlayer;
          var anotherRandomPlayer = data.anotherRandomPlayer;
          modifiedTeam = team;
          team.name = "team-"+Math.random();
          // add player
          team.players.push(anotherRandomPlayer._id);
          team.substitutes = [ anotherRandomPlayer._id ];
          team.captain = randomPlayer._id;
          team.captainSubstitute = ""; // try to empty this relationship.
          team.coach = anotherRandomPlayer._id;
          team.competition = "true";
          return API.Team.update(team, randomPlayer._id, randomPlayer.token);
        }).then(function (team) {
          // VERIFICATION DE LA MODIFICATION DE LA TEAM
          var randomPlayer = data.randomPlayer;
          var anotherRandomPlayer = data.anotherRandomPlayer;
          assert(team.name === modifiedTeam.name, "should have same name");
          assert(team.sport == modifiedTeam.sport, "should have same sport");
          assert(team.players.length === modifiedTeam.players.length, "should have same number of players");
          assert(team.competition === true, "should be same competition bool");
          assert(DB.toStringId(team.captain) === DB.toStringId(randomPlayer), "should have good captain");
          assert(typeof team.captainSubstitute === "undefined", "should have no more captainSubstitute");
          assert(DB.toStringId(team.coach) === DB.toStringId(anotherRandomPlayer), "should have good coach");
          return API.Team.read(team.id);
        }).then(function (team) {
          // 2nd VERIFICATION DE LA MODIFICATION DE LA TEAM
          var randomPlayer = data.randomPlayer;
          var anotherRandomPlayer = data.anotherRandomPlayer;
          assert(team.name === modifiedTeam.name, "should have same name");
          assert(team.sport == modifiedTeam.sport, "should have same sport");
          assert(team.players.length === modifiedTeam.players.length, "should have same number of players");
          assert(team.competition === true, "should be same competition bool");
          assert(DB.toStringId(team.captain.id) === DB.toStringId(randomPlayer), "should have good captain");
          assert(typeof team.captainSubstitute === "undefined", "should have no more captainSubstitute");
          assert(DB.toStringId(team.coach) === DB.toStringId(anotherRandomPlayer), "should have good coach");
        }).then(
         function () { done() },
         function (err) { done(err) }
       );
    });
  });

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
                assert(Shared.computeStreamCommentsSize(team.stream) === team.streamCommentsSize, 'team stream length & streamCommentsSize should be the same (2) ' + team.stream.length + ' vs ' + team.streamCommentsSize);
                done();
              });
            });
          });
        });
      });
    });
  });
});