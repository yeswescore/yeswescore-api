var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Q = require("q")
  , Email = require("../email.js")
  , crypto = require("crypto");
  
/**
 * Authentify a player
 * 
 * Body {
 *   email: { address: ... },    MANDATORY
 *   uncryptedPassword: ...      MANDATORY
 * }
 */
app.post('/v2/auth/', express.bodyParser(), function(req, res){
  var fields = req.query.fields;
  
  if (typeof req.body.email !== "object" || !req.body.email ||
      typeof req.body.email.address !== "string" ||
      typeof req.body.uncryptedPassword !== "string")
    return app.defaultError(res)("missing authentication fields");
  if (req.body.email.address.length === 0)
    return app.defaultError(res)("cannot login with empty email");
  // email should only manipulated lowercase
  req.body.email.address = req.body.email.address.toLowerCase().trim();
  // creating player to hash password.
  var p = new DB.Models.Player();
  p.uncryptedPassword = req.body.uncryptedPassword.trim();
  // app.log("/v2/auth: try to find "+req.body.email.address+" with password "+ p.password+ "uncrypted="+req.body.uncryptedPassword, 'error'); // SHOULD NOT BE USED IN PRODUCTION ENV.
  //
  DB.Models.Player.findOne({
    'email.address': req.body.email.address,
    password: p.password
  }, function (err, player) {
    if (err || !player)
      return app.defaultError(res)("authentication");
    app.log("/v2/auth: found !", "error");
    res.send(JSON.stringifyModels(player, { unhide: [ "token" ] }));
  });
});

/**
 * Check if the email exist
 * 
 * You must be authentified
 * 
 * Specific options:
 *  /v2/auth/registered/?email=...
 */
app.get('/v2/auth/registered/', function (req, res) {
  if (typeof req.query.email !== "string")
    return app.defaultError(res)("missing email");
    
  DB.Models.Player.isEmailRegisteredAsync(req.query.email.toLowerCase())
  .then(function (emailRegistered) {
      res.send({'registered': emailRegistered || false});
    }, app.defaultError(res));
});

/**
 * Reset a user password.
 * 
 * Body {
 *   email: { address: ... },    MANDATORY
 * }
 */
app.post('/v2/auth/resetPassword/', express.bodyParser(), function(req, res){
  var fields = req.query.fields;
  
  if (typeof req.body.email !== "object" || !req.body.email ||
      typeof req.body.email.address !== "string")
    return app.defaultError(res)("missing authentication fields");
  if (req.body.email.address.length === 0)
    return app.defaultError(res)("empty email");
  // email should only manipulated lowercase
  req.body.email.address = req.body.email.address.toLowerCase().trim();
  //
  DB.Models.Player.findOne({
    'email.address': req.body.email.address,
    'email.status': 'confirmed'
  }, function (err, player) {
    if (err)
      return app.defaultError(res)("internal error");
    if (!player)
      return app.defaultError(res)("email not registered");
    // we have found the player, now update it's password.
    var shasum = crypto.createHash('sha256');
    shasum.update(String(Math.random()*42));
    var newUncryptedPassword = shasum.digest('hex').substr(0, 6);
    player.uncryptedPassword = newUncryptedPassword;
    player.save(function (err) {
      if (err)
        return app.defaultError(res)("internal error");
      // everything went ok => sending email
      app.log('sending new password to '+req.body.email.address);
        Email.sendPasswordReset(player.email.address, newUncryptedPassword, player.language);
      res.send(JSON.stringify({ message: "email send"}));
    });
  });
});
