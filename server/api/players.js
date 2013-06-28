var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Email = require("../email.js")
  , Conf = require("../conf.js")
  , Q = require("q");

/**
 * Read All Players
 * 
 * Generic options:
 *  /v2/players/?limit=10              (default=10)
 *  /v2/players/?offset=0              (default=0)
 *  /v2/players/?fields=name           (default=undefined)
 *  /v2/players/?longitude=40.234      (default=undefined)
 *  /v2/players/?latitude=40.456       (default=undefined)
 *  /v2/players/?distance=20           (default=undefined)
 *
 * Specific options:
 *  /v2/players/?club=:id   (filter with a club)
 */
app.get('/v2/players/', function(req, res){
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  var club = req.query.club;
  var fields = req.query.fields;
  var longitude = req.query.longitude;
  var latitude = req.query.latitude;
  var distance = req.query.distance;
  var text = req.query.q;

  var query = DB.Model.Player.find()
  if (fields)
    query.select(fields.replace(/,/g, " "))
  if (longitude && latitude && distance)
    query.where('location.currentPos').within.centerSphere({ center: [ parseFloat(longitude), parseFloat(latitude) ], radius: parseFloat(distance) / 6378.137 });
  if (club)
    query.where("club.id", club);
  if (text) {
    text = new RegExp("("+text.searchable().pregQuote()+")");
    query.where("_searchableName", text);
  }
  query.where("type", "default");  
  query.skip(offset)
       .limit(limit)
       .exec(function (err, players) {
    if (err)
      return app.defaultError(res)(err);
    res.send(JSON.stringifyModels(players));
  });
});

/**
 * Autocomplete search in players
 * 
 * Generic options:
 *  /v2/players/autocomplete/?limit=5               (default=5)
 *  /v2/players/autocomplete/?fields=name           (default=name,type,club)
 *  /v2/players/autocomplete/?sort=name             (default=name)
 *  /v2/players/autocomplete/?longitude=40.234      (default=undefined)
 *  /v2/players/autocomplete/?latitude=40.456       (default=undefined)
 *  /v2/players/autocomplete/?distance=20           (default=undefined)
 *
 * Specific options:
 *  /v2/players/autocomplete/?q=Charlotte (searched text)
 *  /v2/players/autocomplete/?owner=:id   (autocomplete centered to an owner)
 */
app.get('/v2/players/autocomplete/', function(req, res){
  var fields = req.query.fields || "name,type,club";
  var limit = req.query.limit || 5;
  var owner = req.query.owner;
  var sort = req.query.sort || "name";
  var text = req.query.q;
  var longitude = req.query.longitude;
  var latitude = req.query.latitude;
  var distance = req.query.distance;
  
  if (text) {
    // slow
    text = new RegExp("("+text.searchable().pregQuote()+")");
    // searching
    var query = DB.Model.Player
      .find({
        $and: [
          { _searchableName: text },
          { $or: [ {type: "default"}, {type: "owned", owner: owner} ] }
        ]
      });
    if (longitude && latitude && distance)
      query.where('location.currentPos').within.centerSphere({ center: [ parseFloat(longitude), parseFloat(latitude) ], radius: parseFloat(distance) / 6378.137 });
    query.select(fields.replace(/,/g, " "))
      .sort(sort.replace(/,/g, " "))
      .limit(limit)
      .exec(function (err, players) {
        if (err)
          return app.defaultError(res)(err);
        res.send(JSON.stringifyModels(players));
      });
  } else {
    res.send(JSON.stringify([]));
  }
});

/**
 * Read a player
 * 
 * Authentication provide password & token
 * 
 * Generic options:
 *  /v2/players/:id/?fields=name
 *
 * Specific options:
 */
app.get('/v2/players/:id', function(req, res){
  var fields = req.query.fields;
  
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      var query = DB.Model.Player.findById(req.params.id);
      if (fields)
         query.select(fields.replace(/,/g, " "))
      query.exec(function (err, player) {
        if (err)
          return app.defaultError(res)(err);
        if (player === null)
          return app.defaultError(res)("no player found");
        if (authentifiedPlayer)
          res.send(JSON.stringifyModels(player, { unhide: [ "token" ] }));
        else
          res.send(JSON.stringifyModels(player));
      });
    },
    app.defaultError(res, "authentication error"));
});

/**
 * Read games of a player
 * 
 * Generic options:
 *  /v2/players/:id/games/?limit=5     (default=10)
 *  /v2/players/:id/games/?offset=0    (default=0)
 *  /v2/players/:id/games/?sort=name   (default=-dates.start)
 * 
 * Specific options:
 *  /v2/players/:id/games/?owned=true  (default=undefined)
 *  /v2/players/:id/games/?status=ongoing   (default=created,ongoing,finished)
 *  /v2/players/:id/games/?populate=teams.players (default=teams.players)
 * 
 * owned=undefined games owned or played by the player
 * owned=true      games owned by the player
 * owned=false     games where the player plays
 * NON STANDARD URL
 */
app.get('/v2/players/:id/games/', function(req, res){
  var status = req.query.status || "created,ongoing,finished";
  var sort = req.query.sort || "-dates.start";
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  var fields = req.query.fields || "status,sport,owner,dates.creation,dates.start,dates.end,location.country,location.city,location.currentPos,teams,teams.players.name,teams.players.club,teams.players.rank,infos.type,infos.subtype,infos.status,infos.sets,infos.score,infos.court,infos.surface,infos.tour,infos.startTeam";
  var owned = null;
  owned = (req.query.owned === "true") ? true : owned;
  owned = (req.query.owned === "false") ? false : owned;
  // populate option
  var populate = "teams.players";
  if (typeof req.query.populate !== "undefined")
    populate = req.query.populate;
  var populatePaths = (typeof populate === "string") ? populate.split(",") : [];
  // process fields
  var fields = app.createPopulateFields(fields, populate);
  DB.Model.Player.findById(req.params.id, function (err, club) {
    if (err)
      return app.defaultError(res)(err);
    if (club === null)
      return app.defaultError(res)("no player found");
    var query;
    if (owned === null)
      query = DB.Model.Game.find({ $or: [ 
        {owner : req.params.id}, {"teams.players" : req.params.id}
      ] });
    if (owned === true)
      query = DB.Model.Game.find({ owner : req.params.id});
    if (owned === false)
      query = DB.Model.Game.find({"teams.players" : req.params.id});
    query.select(fields.select);
    if (status)
      query.where('status').in(status.split(","));
    query.populate("teams.players", fields["teams.players"])
         .sort(sort.replace(/,/g, " "))
         .skip(offset)
         .limit(limit)
         .exec(function (err, games) {
         if (err)
            return app.defaultError(res)(err);
         res.send(JSON.stringifyModels(games));
       });
    });
});

/**
 * Create a new player
 * 
 * No authentication
 * 
 * Body {
 *   name: String,     (default="")
 *   rank: String,     (default="")
 *   email: { 
 *     address: String,    (default="")
 *   },
 *   language: String  (default=cf configuration)
 *   idlicense: String (default="")
 *   club: { id:..., name:... }  (default=null, name: is ignored)
 *   type: String      (enum=default,owned default=default)
 * }
 */
app.post('/v2/players/', express.bodyParser(), function(req, res){
  if (req.body.type &&
      DB.Definition.Player.type.enum.indexOf(req.body.type) === -1)
    return app.defaultError(res)("unknown type");

  // preprocessing req.body.
  req.body.location = (req.body.location) ? req.body.location : {};
  req.body.email = (req.body.email) ? req.body.email : {};
  if (req.body.email && typeof req.body.email.address === "string")
    req.body.email.address = req.body.email.address.toLowerCase();
  
  var emailConfirmationRequired = false;
  
  Q.fcall(function () {
    if (req.body.email && typeof req.body.email.address === "string")
      return DB.Model.Player.isEmailRegisteredAsync(req.body.email.address);
    return null;
  }).then(function (emailRegistered) {
    if (emailRegistered)
      throw "email already registered";
  }).then(function () {
    var club = req.body.club;
    if (club && club.id)
      return Q.nfcall(DB.Model.Club.findById.bind(DB.Model.Club), club.id);
    return null;
  }).then(function (club) {
    // creating a new player
    var inlinedClub = (club) ? { id: club.id, name: club.name } : null;
    var player = new DB.Model.Player({
        name: req.body.name || "",
        location : { currentPos: req.body.location.currentPos || [] },
        rank: req.body.rank || "",
        idlicense: req.body.idlicense || "",
        club: inlinedClub, // will be undefined !
        type: req.body.type || "default"
    });
    // language
    player.languageSafe = req.body.language || Conf.get("default.language");
    // email
    if (req.body.email && typeof req.body.email.address === "string") {
      // registering email.
      // might be race condition between check & set. but will be catch by the index.
      player.email.address = req.body.email.address;
      player.email.status = "pending-confirmation";
      player.email._token = DB.Model.Player.createEmailToken();
      player.email._dates._created = Date.now();
      // sending token by email.
      emailConfirmationRequired = true;
    }
    // password
    if (req.body.uncryptedPassword)
      player.uncryptedPassword = req.body.uncryptedPassword;
    return DB.saveAsync(player);
  }).then(function (player) {
    // everything went ok => sending email confirmation
    if (emailConfirmationRequired)
      Email.sendEmailConfirmation(player.email.address, player.email._token, player.language);
    res.send(JSON.stringifyModels(player, { unhide: [ "token" ] }));
  }, app.defaultError(res));
});

/**
 * update a player
 * 
 * You must be authentified (?playerid=...&token=...)
 * 
 * Body {
 *   name: String,     (default=undefined)
 *   rank: String,     (default=undefined)
 *   email: {
 *     address: String,  (default=undefined)
 *   },
 *   language: String    (default=undefined)
 *   idlicense: String   (default=undefined)
 *   club: { id:..., name:... }  (default=undefined, name: is ignored)
 *   password: String  (default=undefined)
 * }
 */
app.post('/v2/players/:id', express.bodyParser(), function(req, res){
  if (req.body.email && typeof req.body.email.address === "string")
    req.body.email.address = req.body.email.address.toLowerCase();
  var emailConfirmationRequired = false;
  var club = req.body.club;
  Q.all(
    [
      // doing in parallel 2 things
      // 1-st : find the club
      Q.fcall(function () {
        if (club && club.id)
          return DB.Model.findByIdAsync(DB.Model.Club, club.id);
        return null;
      }),
      // 2nd : authentify & find the player
      DB.isAuthenticatedAsync(req.query)
        .then(function (authentifiedPlayer) {
        if (!authentifiedPlayer)
          throw "player not authenticated";
        return authentifiedPlayer;
      }),
      Q.fcall(function () {      
          return DB.Model.findByIdAsync(DB.Model.Player, req.params.id);
      })      
    ]
  ).then(function (qall) {
    var club = qall[0];
    var player = qall[1];
    var playerowned = qall[2];
    
    if (playerowned.id != req.query.playerid && playerowned.owner != req.query.playerid)
      throw "player not owned";      
    
    if (playerowned.id != req.query.playerid)
      player = playerowned;
        
    // updating player
    var inlinedClub = (club) ? { id: club.id, name: club.name } : null;
    if (inlinedClub) {
      player["club"] = inlinedClub;
    }
    ["name", "rank", "idlicense"].forEach(function (o) {
      if (typeof req.body[o] !== "undefined")
        player[o] = req.body[o];
    });
    // language
    if (typeof req.body.language !== "undefined")
      player.languageSafe = req.body.language;
    // position
    if (req.body.location && req.body.location.currentPos)
      player.location = { currentPos : req.body.location.currentPos };
    // password
    if (req.body.uncryptedPassword)
      player.uncryptedPassword = req.body.uncryptedPassword;
    player.dates.update = Date.now();
    // email
    if (req.body.email && typeof req.body.email.address === "string")
    {
      // user want to "unregister"
      if (req.body.email.address == "") {
        if (player.email) {
          player.email = undefined;
        }
      } else {
        // update ?
        if (!player.email ||
             player.email.address !== req.body.email.address) {
          // we need to update
          // first: backup old address if confirmed
          if (player.email && player.email.address &&
              player.email.status === "confirmed")
            player.email._backup = player.email.address;
          // second: update db to use new address.
          player.email.address = req.body.email.address;
          player.email.status = "pending-confirmation";
          player.email._token = DB.Model.Player.createEmailToken();
          player.email._dates._created = Date.now();
          player.email._dates._confirmed = undefined;
          emailConfirmationRequired = true;
        }
      }
    }
    // saving player
    return DB.saveAsync(player);
  }).then(function (player) {
    if (emailConfirmationRequired)
      Email.sendEmailConfirmation(player.email.address, player.email._token, player.language);
    res.send(JSON.stringifyModels(player, { unhide: [ "token" ] }));
  }, app.defaultError(res));
});
