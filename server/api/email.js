var Conf = require("../conf.js")
  , DB = require("../db.js")
  , Email = require("../email.js")
  , app = require("../app.js");

app.get('/v1/email/confirm/', function (req, res) {
  if (typeof req.query.token !== "string" || !req.query.token)
    return app.defaultError(res)("missing token");
  DB.Model.Player.findOne(
    { "email._token" : req.query.token },
    function (err, player) {
      if (err)
        return res.end("FIXME: should redirect to an error page (db read error)");
      if (!player) {
        // FIXME: redirect 301 vers une page d'erreur.
        return res.end("FIXME: should redirect to an error page (can't find player)");
      }
      // changing email status
      player.email.status = "confirmed";
      player.save(function (err) {
        if (err)
          return res.end("FIXME: should redirect to an error page (db save error)");
        //res.end("http://www.yeswescore.com/#!mail/cy9y");
        res.end(JSON.stringifyModels(player, { unhide: [ "token" ] }));
      });
  });
});

if (Conf.env === "DEV") {
  // shortcut to test in DEV environment mailing features... 
  //  no UT yet :(
  app.get('/v1/email/createFakePlayer/', function (req, res) {
    if (typeof req.query.email !== "string" || !req.query.email)
      return app.defaultError(res)("missing email");
    var player = new DB.Model.Player({
        nickname: "syndr0m",
        name: "Marc Dassonneville",
        location : { currentPos: [] },
        rank: "",
        idlicense: "",
        type: "default",
        email: {
          address: req.query.email,
          status: "pending-confirmation",
          _token: DB.Model.Player.createEmailToken()
        }
    });
    player.save(function (err) {
      if (err)
        return app.defaultError(res)(err);
      res.end(JSON.stringifyModels(player, { unhide: [ "token" ] }));
    });
  });
  
  app.get('/v1/email/sendConfirmation/', function (req, res) {
    if (typeof req.query.email !== "string" || !req.query.email)
      return app.defaultError(res)("missing email");
    var language = req.query.language || "fr";
    DB.Model.Player.findOne(
      { "email.address" : req.query.email },
      function (err, player) {
        if (err)
          return app.defaultError(res)(err);
        if (!player)
          return app.defaultError(res)("no player found ("+req.query.email+")");
        if (player.email.status !== "pending-confirmation")
          return app.defaultError(res)("wrong status ? already send ?");
        if (typeof player.email._token === "undefined")
          return app.defaultError(res)("no token found");
        var url = Email.sendEmailConfirmation(player.email.address, player.email._token, language);
        res.end('email send, callback url='+url);
      });
  });
  
  // hand unit test :)
  app.get('/v1/email/sendPassword/', function (req, res) {
    if (typeof req.query.email !== "string" || !req.query.email)
      return app.defaultError(res)("missing email");
    var language = req.query.language || "fr";
    
    var data = JSON.stringify({ email: { address: req.query.email } });
    var postOptions = {
      host: Conf["http.host"],
      port: Conf["http.port"],
      path: Conf["api.auth"]+"resetPassword/",
      method : "POST",
      headers : {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    // posting to ourself
    var http = require("http");
    var r = http.request(postOptions, function(re) {
      var answer = "";
      re.on("data", function (chunk) { answer += chunk })
        .on("end", function () {
          // forwarding result
          res.end(answer);
        });
    });
    r.on("error", function (e) {
      app.defaultError(res)(err);
    });
    r.write(data);
    r.end();
  });
}