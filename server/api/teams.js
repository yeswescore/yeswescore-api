var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Q = require("../q.js") // Q overloaded ! w00t
  , Push = require("../push.js")
  , Resources = require("../strings/resources.js")
  , mongoose = require("mongoose")
  , Authentication = require("../authentication.js")
  , ObjectId = mongoose.Types.ObjectId;

/**
 * Read teams
 *
 * Generic options:
 *  /v2/teams/?limit=10              (default=10)
 *  /v2/teams/?offset=0              (default=0)
 *  /v2/teams/?fields=name           (default=undefined)
 *
 * Specific options:
 *  /v2/teams/?q=EquipeA (searched text)
 *  /v2/teams/?club=:id   (filter with a club)
 */
app.get('/v2/teams/', function(req, res){
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  var club = req.query.club;
  var fields = req.query.fields ||
    "sport,name,dates,dates.creation,"+
    "players,captain,substitutes,captainSubstitute,coach,"+
    "club,competition,profile";
  var text = req.query.q;

  var query = DB.Model.Team.find()
  if (fields)
    query.select(fields.replace(/,/g, " "))
  if (club)
    query.where("club", club);
  if (text) {
    text = new RegExp("("+text.searchable().pregQuote()+")");
    query.where("_searchableName", text);
  }
  query.where("_deleted", false);
  query.skip(offset)
       .limit(limit)
       .exec(function (err, teams) {
    if (err)
      return app.defaultError(res)(err);
    res.send(JSON.stringifyModels(teams));
  });
});

/**
 * Autocomplete search in teams
 *
 * Generic options:
 *  /v2/teams/autocomplete/?limit=5               (default=5)
 *  /v2/teams/autocomplete/?fields=name           (default=name,type,club)
 *  /v2/teams/autocomplete/?sort=name             (default=name)
 *
 * Specific options:
 *  /v2/teams/autocomplete/?q=EquipeA (searched text)
 */
app.get('/v2/teams/autocomplete/', function(req, res){
  var fields = req.query.fields || "name,club";
  var limit = req.query.limit || 5;
  var owner = req.query.owner;
  var sort = req.query.sort || "name";
  var text = req.query.q;

  // current algorithm is just a text search.
  if (text) {
    var query = DB.Model.Team.find();
    text = new RegExp("("+text.searchable().pregQuote()+")");
    query.where('_searchableName', text);
    query.where('_deleted', false);
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
 * Read a team
 *
 * Generic options:
 *  /v2/teams/?fields=name
 *
 * Specific options:
 *  /v2/teams/?populate=...  default=players,substitutes,captain,captainSubstitute,coach,club
 */
app.get('/v2/teams/:id', function(req, res){
  var fields = req.query.fields;
  // populate option
  var populate = "players,substitutes,captain,captainSubstitute,coach,club";
  if (typeof req.query.populate === "string")
    populate = req.query.populate;
  //
  var query = DB.Model.Team.findById(req.params.id);
  if (fields)
    query.select(fields.replace(/,/g, " "));
  if (populate)
    query.populate(populate.replace(/,/g, " "));
  query.exec(function (err, team) {
    if (err)
      return app.defaultError(res)(err);
    if (team === null)
      return app.defaultError(res)("no team found");
    res.send(JSON.stringifyModels(team));
  });
});

/**
 * Create a new Team
 *
 * You must be authentified
 * You must give at least 1 players/captain/substitute/captainSubstitute/coach
 *
 * Body {
 *   name: String,     (default="")
 *   sport, String,    (default="tennis")
 *   profile: {
 *     image: String   (default=undefined)
 *   }
 *   club: id,                             (default=undefined)
 *   players: [ id, id, ... ],             (default=[owner])
 *   substitutes: [ id, id, ... ],,        (default=[])
 *   captain: id,                          (default=undefined)
 *   captainSubstitute : id,               (default=undefined)
 *   coach: id,                            (default=undefined)
 *   competition: Boolean                  (default=true)
 * }
 */
app.post('/v2/teams/', express.bodyParser(), function(req, res){
  // must have a team name
  if (typeof req.body.name !== "string" || !req.body.name)
    return app.defaultError(res)("missing name");
  // check if "owner" is in players/substitutes/captain/captainSubstitute/coach
  var ownersIds = DB.Model.Team.getOwnersIds(req.body);
  if (ownersIds.indexOf(req.query.playerid) === -1)
    return app.defaultError(res)("owner must be a player/substitute/captain/captainSubstitute or coach");
  var data;
  DB.Model.Team.checkFields(req.body)
   .then(Authentication.Query.authentify(req.query))
   .ensure(DB.Model.Club.existOrEmpty(req.body.club)).isNot(false, "club error")
   .ensure(DB.Model.Player.existOrEmpty(ownersIds)).isNot(false, "owner error")
   .then(function () {
      var team = new DB.Model.Team({
        sport: req.body.sport || "tennis",
        name: req.body.name || ""
      });
      if (req.body.profile && typeof req.body.profile.image === "string")
        team.profile = { image: req.body.profile.image };
      if (DB.toStringId(req.body.club))
        team.club = DB.toStringId(req.body.club);
      if (Array.isArray(req.body.players))
        team.players = req.body.players;
      if (Array.isArray(req.body.substitutes))
        team.substitutes = req.body.substitutes;
      if (req.body.captain)
        team.captain = req.body.captain;
      if (req.body.captainSubstitute)
        team.captainSubstitute = req.body.captainSubstitute;
      if (req.body.coach)
        team.coach = req.body.coach;
      if (typeof req.body.competition !== "undefined")
        team.competition = (req.body.competition === "true");
      return DB.saveAsync(team);
   }).then(function (team) {
     res.send(JSON.stringifyModels(team));
   }, app.defaultError(res));
});

/**
 * Modify a new Team
 *
 * You must be authentified
 * You must give at least 1 players/captain/substitute/captainSubstitute/coach
 *
 * Body {
 *   name: String,     (default="")
 *   sport, String,    (default="tennis")
 *   profile: {
 *     image: String   (default=undefined)
 *   }
 *   club: id,                             (default=undefined)
 *   players: [ id, id, ... ],             (default=[owner])
 *   substitutes: [ id, id, ... ],,        (default=[])
 *   captain: id,                          (default=undefined)
 *   captainSubstitute : id,               (default=undefined)
 *   coach: id,                            (default=undefined)
 *   competition: Boolean                  (default=true)
 * }
 */
app.post('/v2/teams/:id/', express.bodyParser(), function(req, res){
  if (typeof req.body.name === "string" && !req.body.name)
    return app.defaultError(res)("empty name"); // doesn't allow empty names
  var ownersIds = DB.Model.Team.getOwnersIds(req.body)
    , data = { team: null };
  // check if "owner" is in players/substitutes/captain/captainSubstitute/coach
  if (ownersIds.indexOf(req.query.playerid) === -1)
    return app.defaultError(res)("owner must be a player/substitute/captain/captainSubstitute or coach");
  // 4 checks
  Q.all[
    // player is correctly authentified & exist in DB
    DB.Model.Team.checkFields(req.body)
      .then(Authentication.Query.authentify(req.query)),
    // club (if submited) exist in DB
    Q.ensure(DB.Model.Club.existOrEmpty(req.body.club))
     .isNot(false, "club error"),
    // every players submited exist in DB (heavy)
    Q.ensure(DB.Model.Player.existOrEmpty(ownersIds))
     .isNot(false, "owner error"),
    // the team also exist in DB.
    Q.ensure(Q.ninvoke(DB.Model.Team, 'findById', req.params.id))
     .isNot(null, "unknown team")
     .inject(data, "team")
  ].then(function () {
    var team = data.team;
    // security, is playerid an ownersIds ?
    var dbOwnersIds = DB.Model.Team.getOwnersIds(team);
    if (dbOwnersIds.indexOf(req.params.playerid) === -1)
      throw "unauthorized";
    if (typeof req.body.name === "string")
      team.name = req.body.name;
    if (req.body.profile && typeof req.body.profile.image === "string")
      team.profile = { image: req.body.profile.image };
    if (DB.toStringId(req.body.club))
      team.club = DB.toStringId(req.body.club);
    if (Array.isArray(req.body.players))
      team.players = req.body.players;
    if (Array.isArray(req.body.substitutes))
      team.substitutes = req.body.substitutes;
    if (typeof req.body.captain !== "undefined")
      team.captain = req.body.captain;
    if (typeof req.body.captainSubstitute !== "undefined")
      team.captainSubstitute = req.body.captainSubstitute;
    if (typeof req.body.competition !== "undefined")
      team.competition = (req.body.competition === "true");
    if (req.body.coach)
      team.coach = req.body.coach;
    // updating date
    team.dates.update = Date.now();
    //
    return DB.save(team);
  }).then(function (team) {
    // forward sur la lecture de team classique.
    app.internalRedirect('/v2/teams/:id')(
    {
      query: { },
      params: { id: team.id }
    },
    res);
  }, app.defaultError(res));
});
