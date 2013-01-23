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
  
  describe('FIXME: club creation', function() {
    it('should create clubs', function (done) {
      done(/* FIXME */);
    });
  });
});

