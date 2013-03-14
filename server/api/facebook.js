var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Conf = require("../conf.js")
  , https = require("../https.js")
  , Q = require("q");

/**
 * registering facebook id & token
 * 
 * You must be authentified (?playerid=...&token=...)
 * 
 * 4 Parameters are required :
 * /v1/connections/fb/?playerid=...       player id
 * /v1/connections/fb/?token=...          player token
 * /v1/connections/fb/?access_token=...   facebook access_token
 */
app.get('/v1/facebook/login/', function(req, res){
  var scheme = Conf.get("facebook.yws.scheme")
    , host = Conf.get("facebook.yws.host")
    , port = Conf.get("facebook.yws.port");
  
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      if (!authentifiedPlayer)
        throw "player not authenticated";
      return authentifiedPlayer;
    }).then(function (player) {
      // checking fb token
      
      
      // connecting to facebook...
      var clientId = Conf.get('facebook.app.id')
        , clientSecret = Conf.get('facebook.app.secret');
      
      https.get({
        host: Conf.get('facebook.graph.host'),
        port: Conf.get('facebook.graph.port'),
        path: "oauth/access_token?" +
           "grant_type=fb_exchange_token&" +
           "client_id=" + clientId + "&" +
           "client_secret=" + clientSecret + "&"
           "fb_exchange_token
      });
      
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