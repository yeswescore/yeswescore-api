var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");
  
if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:connections', function(){
  describe('update a player fb token without token', function () {
    it('should be an error (302 => error.html)', function (done) {
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
          path: Conf["api.connections"]+"fb/?playerid="+randomPlayer._id+"&token=badToken&fbid=4242&fbtoken=4242"
        };
        http.get(options, function (res) {
          assert(res.statusCode == 302, "must have been redirected");
          assert(res.headers.location.indexOf("error.html") != -1, "must have an error in " + res.headers.location);
          assert(res.headers.location.indexOf("success.html") == -1, "musn't have a success in " + res.headers.location);
          
          done();
        });
      });
    });
  });
  
  describe('update a player fb token ', function () {
    it('should be updated (301 => success.html)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer);
        assert.isId(randomPlayer._id);
        
        var fbid = Math.round(Math.random()*1000000);
        var fbtoken = Math.round(Math.random()*1000000);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.connections"]+"fb/?playerid="+randomPlayer._id+"&token="+randomPlayer.token+"&fbid="+fbid+"&fbtoken="+fbtoken
        };
        http.get(options, function (res) {
          assert(res.statusCode == 302, "must have been redirected");
          assert(res.headers.location.indexOf("error.html") == -1, "mustn't have an error in " + res.headers.location);
          assert(res.headers.location.indexOf("success.html") != -1, "must have a success in " + res.headers.location);
          
          // console.log(res);
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+randomPlayer._id+"/?playerid="+randomPlayer._id+"&token="+randomPlayer.token
          };
          http.getJSON(options, function (modifiedPlayer) {
            assert.isPlayerWithToken(modifiedPlayer, "must be a player");
            assert(modifiedPlayer.connection.facebook.id == fbid, "must have same fbid");
            assert(modifiedPlayer.connection.facebook.token == fbtoken, "must have same fbtoken");
        
            done();
          });
        });
      });
    });
  });
});
        