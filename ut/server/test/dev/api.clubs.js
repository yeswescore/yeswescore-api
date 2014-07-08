var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");

if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:clubs', function(){
  // READ
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
          path: Conf["api.clubs"]+randomclub._id
        };
        http.getJSON(options, function (club) {
          assert.isClub(club, "must be a club");
          assert(club.id === randomclub._id, "must be same club");
          done();
        });
      });
    });
  });
  
  // PARAMETERS
  describe('FIXME: read api club using wrong id parameters', function() {
    it('should throw an error', function (done) {
      done(/* FIXME */);
    });
  });

  describe('FIXME: read random document club, then read api club filtering fields', function() {
    it('should filter fields using fields= option', function (done) {
      done(/* FIXME */);
    });
  });
  
  describe('create random club, read it', function() {
    it('should create the club', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };

      http.getJSON(options, function (randomPlayer) {
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.clubs"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };

        var newClub = {
          name : "club-"+Math.random(),
          location: {
            address: "Hotel de ville",
            city: "Lyon",
            zip: "zip"+Math.random(),
            pos: [ 42, 43 ]
          },
          fedid: String(Math.random()),
          ligue: "ligue"+Math.random(),
          outdoor: Math.round(Math.random() * 10),
          indoor: Math.round(Math.random() * 10),
          countPlayers: Math.round(Math.random() * 100),
          countPlayers1AN: Math.round(Math.random() * 100),
          countTeams: Math.round(Math.random() * 10),
          countTeams1AN: Math.round(Math.random() * 10),
          school: "school"+Math.random()
        };
        http.post(options, newClub, function (club) {
          assert.isClub(club);
          assert(club.name === newClub.name, "should have same name");
          assert(club.location.address == newClub.location.address);
          assert(club.location.city == newClub.location.city);
          assert(club.location.pos[0] == newClub.location.pos[0]);
          assert(club.location.pos[1] == newClub.location.pos[1]);
          assert(club.location.zip === newClub.location.zip, "should have same zip");

          assert(club.fedid === newClub.fedid, "should have same fedid");
          assert(club.ligue === newClub.ligue, "should have same ligue");

          assert(club.outdoor === newClub.outdoor, "should have same outdoor");
          assert(club.indoor === newClub.indoor, "should have same indoor (" + club.indoor + " vs " + newClub.indoor + ")");
          assert(club.countPlayers === newClub.countPlayers, "should have same countPlayers");
          assert(club.countPlayers1AN === newClub.countPlayers1AN, "should have same countPlayers1AN");
          assert(club.countTeams === newClub.countTeams, "should have same countTeams");
          assert(club.countTeams1AN === newClub.countTeams1AN, "should have same countTeams1AN");
          assert(club.school === newClub.school, "should have same school");

          done();
        });
      });
    });
  });
  
  describe('create random club, create a second one with same name+city', function() {
    it('should create the club', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };

      http.getJSON(options, function (randomPlayer) {
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.clubs"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };

        var randomName = "club-"+Math.random();
        var randomCity = "city-"+Math.random();

        var newClub = {
          name : randomName,
          location: {
            city: randomCity
          }
        };
        http.post(options, newClub, function (club) {
          assert.isClub(club);
          assert(club.name === newClub.name, "should have same name");
          assert(club.location.city === newClub.location.city, "should have same city");

          // try to create a 2nd one
          var newClub2 = {
            name : randomName,
            location: {
              city: randomCity
            }
          };

          http.post(options, newClub2, function (error) {
            assert.isError(error, "should be an error");
            assert(error.error === "club already registered", "should have error club already registered");

            done();
          });
        });
      });
    });
  });
  
  describe('create random club located in borabora, then search it from tupai within 50km & search it from 10km', function() {
    it('should find the club first then not find it', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };

      http.getJSON(options, function (randomPlayer) {
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.clubs"]+"?playerid="+randomPlayer._id+"&token="+randomPlayer.token
        };

        var positions = {
          borabora : [ -151.741305, -16.500436 ],
          tupai : [ -151.816893, -16.249431 ]
        };

      var nameFilter = "club"+Math.random();

        var newClub = {
          name : nameFilter,
          location: {
            city: "borabora",
            pos: positions.borabora
          }
        };
        http.post(options, newClub, function (club) {
          assert.isClub(club);

          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.clubs"]+"autocomplete/?longitude="+positions.tupai[0]+"&latitude="+positions.tupai[1]+"&distance=50&q="+nameFilter
          };

          http.getJSON(options, function (clubs) {
            console.log('clubs1',clubs);
            assert.isArray(clubs, 'clubs should be an array');
            assert(clubs.length === 1, 'must have found at least one club !');
            assert(clubs[0].id == club.id, 'must have same id :' + club.id + ' vs ' + clubs[0].id);

            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.clubs"]+"autocomplete/?longitude="+positions.tupai[0]+"&latitude="+positions.tupai[1]+"&distance=10&q="+nameFilter
            };

            http.getJSON(options, function (clubs) {
              console.log('clubs2',clubs);
              assert.isArray(clubs, 'clubs should be an array');
              assert(clubs.length === 0, 'cannot find the club (too far away)');
              done();
            });
          });
        });
      });
    });
  });

    describe('FIXME: read clubs filtering by sport', function() {
        it('should read clubs using filter ?sport=tennis', function (done) {
            done(/* FIXME */);
        });
    });

});

