var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Q = require("q");
  
/**
 * Authentify a player
 * 
 * Body {
 *   email: { address: ... },    MANDATORY
 *   uncryptedPassword: ...      MANDATORY
 * }
 */
app.post('/v1/auth/', express.bodyParser(), function(req, res){
  var fields = req.query.fields;
  
  if (typeof req.body.email !== "object" || !req.body.email ||
      typeof req.body.email.address !== "string" ||
      typeof req.body.uncryptedPassword !== "string")
    return app.defaultError(res)("missing authentication fields");
  if (req.body.email.address.length === 0)
    return app.defaultError(res)("cannot login with empty email");
  // creating player to hash password.
  var p = new DB.Model.Player();
  p.uncryptedPassword = req.body.uncryptedPassword;
  //
  DB.Model.Player.findOne({
    'email.address': req.body.email.address,
    password: p.password
  }, function (err, player) {
    if (err || !player)
      return app.defaultError(res)("authentication");
    res.end(JSON.stringifyModels(player, { unhide: [ "token" ] }));
  });
});