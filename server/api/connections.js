var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Conf = require("../conf.js")
  , Q = require("q");

/**
 * registering facebook player
 */
app.get('/v1/connections/fb/', function(req, res){
  var scheme = Conf.get("facebook.yws.scheme")
    , host = Conf.get("facebook.yws.host")
    , port = Conf.get("facebook.yws.port");
  
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      if (!authentifiedPlayer)
        throw "player not authenticated";
      return authentifiedPlayer;
    }).then(function (player) {
      // saving facebook id & token.
      player.connection.facebook.id = req.query.fbid;
      player.connection.facebook.token = req.query.fbtoken;
      return Q.nfcall(player.save.bind(player));
    }).then(function () {
      var page = Conf.get("facebook.yws.connect.success");
      var url = scheme+"://"+host+":"+port+page;
      res.redirect(url);
    }, function (e) {
      var page = Conf.get("facebook.yws.connect.error");
      var url = scheme+"://"+host+":"+port+page+"#message="+encodeURIComponent(e);
      res.redirect(url);
    });
});