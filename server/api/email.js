var Conf = require("../conf.js")
  , DB = require("../db.js")
  , Email = require("../email.js")
  , app = require("../app.js");
  
/*
Nouvelle url :
http://www.yeswescore.com/static/mail-cant-find-player.html
http://www.yeswescore.com/static/mail-confirm.html
http://www.yeswescore.com/static/mail-db-read-error.html
http://www.yeswescore.com/static/mail-db-save-error.html
*/

app.get('/v2/email/confirm/', function (req, res) {
  if (typeof req.query.token !== "string" || !req.query.token)
    return app.defaultError(res)("missing token");
  DB.Model.Player.findOne(
    { "email._token" : req.query.token },
    function (err, player) {
      if (err)
        return res.redirect("http://www.yeswescore.com/#!mail-db-read-error/c1fj5");
      if (!player) {
        // FIXME: redirect 301 vers une page d'erreur.
        return res.redirect("http://www.yeswescore.com/#!mail-cant-find-player/c1gv2");
      }
      // changing email status
      player.email.status = "confirmed";
      player.save(function (err) {
        if (err)
          return res.redirect("http://www.yeswescore.com/#!mail-db-save-error/c1kfo");
        res.redirect("http://www.yeswescore.com/#!mail/cy9y");
      });
  });
});

if (Conf.env === "DEV") {
  // shortcut to test in DEV environment mailing features... 
  //  no UT yet :(
  app.get('/v2/email/createFakePlayer/', function (req, res) {
    if (typeof req.query.email !== "string" || !req.query.email)
      return app.defaultError(res)("missing email");
    req.query.email = req.query.email.toLowerCase();
    var player = new DB.Model.Player({
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
      res.send(JSON.stringifyModels(player, { unhide: [ "token" ] }));
    });
  });
  
  app.get('/v2/email/sendConfirmation/', function (req, res) {
    if (typeof req.query.email !== "string" || !req.query.email)
      return app.defaultError(res)("missing email");
    req.query.email = req.query.email.toLowerCase();
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
        res.send('email send, callback url='+url);
      });
  });
  
  // hand unit test :)
  app.get('/v2/email/sendPassword/', function (req, res) {
    if (typeof req.query.email !== "string" || !req.query.email)
      return app.defaultError(res)("missing email");
    req.query.email = req.query.email.toLowerCase();
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
          res.send(answer);
        });
    });
    r.on("error", function (e) {
      app.defaultError(res)(err);
    });
    r.write(data);
    r.end();
  });
}
