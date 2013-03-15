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
    , port = Conf.get("facebook.yws.port")
    , player;
  
  var error = function (message) {
    var page = Conf.get("facebook.yws.inappbrowser.error");
    var url = scheme+"://"+host+":"+port+page+"#message="+encodeURIComponent(message);
    res.redirect(url);
  };
    
  if (req.query.error)
    return error(req.query.error_description);
  if (!req.query.access_token)
    return error("missing access_token");
  
  console.log('player is facebook login');
  console.log(req.query);
  
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      if (!authentifiedPlayer)
        throw "player not authenticated";
      player = authentifiedPlayer;
    }).then(function () {
      // connecting to facebook...
      var clientId = Conf.get('facebook.app.id')
        , clientSecret = Conf.get('facebook.app.secret');
      
      return https.getAsync({
        host: Conf.get('facebook.graph.host'),
        port: Conf.get('facebook.graph.port'),
        path: "/oauth/access_token?" +
           "grant_type=fb_exchange_token&" +
           "client_id=" + clientId + "&" +
           "client_secret=" + clientSecret + "&" +
           "fb_exchange_token=" + req.query.access_token
      });
    }).then(function (data) {
      // data: access_token=AAAIyivk4N(...)vk4N&expires=5183956
      var infos = /access_token=([^&]+)/.exec(String(data));
      if (!infos)
        throw "long access token";
      
      // saving facebook id & token.
      player.connection.facebook.id = req.query.fbid;
      player.connection.facebook.token = req.query.fbtoken;
      return Q.nfcall(player.save.bind(player));
    }).then(function () {
      var page = Conf.get("facebook.yws.inappbrowser.success");
      var url = scheme+"://"+host+":"+port+page;
      res.redirect(url);
    }, error);
});