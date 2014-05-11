var DB = require("../db.js")
  , Q = require('q')
  , express = require("express")
  , Authentication = require("../authentication.js")
  , app = require("../app.js");

/**
 * YUIDoc
 @module    api
 @submodule clubs
*/
/** 
 * YUIDoc
 @class     getAutocomplete
 @type      Url
 @param     limit  [limit=5]               /v2/clubs/autocomplete/?limit=5
 @param     fields [fields=name,type,club] /v2/clubs/autocomplete/?fields=name
 @param     sort   [sort=name]             /v2/clubs/autocomplete/?sort=name
 
 @return array(clubs)
 
 @example
 * Autocomplete search in clubs
 * 
 * Generic options:
 *  /v2/clubs/autocomplete/?limit=5               (default=5)
 *  /v2/clubs/autocomplete/?fields=name           (default=name,location.city)
 *  /v2/clubs/autocomplete/?sort=name             (default=name)
 *  /v2/clubs/autocomplete/?longitude=40.234      (default=undefined)
 *  /v2/clubs/autocomplete/?latitude=40.456       (default=undefined)
 *  /v2/clubs/autocomplete/?distance=20           (default=undefined)
 *
 * Specific options:
 *  /v2/clubs/autocomplete/?q=Charlotte (searched text)
**/
app.get('/v2/clubs/autocomplete/', function(req, res){
  var fields = req.query.fields || "name,location.city";
  var limit = req.query.limit || 5;
  var sort = req.query.sort || "name";
  var text = req.query.q;
  var longitude = req.query.longitude;
  var latitude = req.query.latitude;
  var distance = req.query.distance;
  
  if (text) {
    // slow
    text = new RegExp("("+text.searchable().pregQuote()+")");
    // searching
    var query = DB.Models.Club
      .find({_searchableName: text})
      .select(fields.replace(/,/g, " "));

    if (longitude && latitude && distance)
      query.where({'location.pos': {$within:{ $centerSphere :[[ parseFloat(longitude), parseFloat(latitude) ], parseFloat(distance) / 6378.137]}}});

    query.sort(sort.replace(/,/g, " "))
      .limit(limit)
      .exec(function (err, clubs) {
        if (err)
          return app.defaultError(res)(err);
        res.send(JSON.stringifyModels(clubs));
      });
  } else {
    res.send(JSON.stringify([]));
  }
});
  
/**
 * Read a club
 * 
 * Generic options:
 *  /v2/clubs/?fields=name
 */
app.get('/v2/clubs/:id', function(req, res){
  var fields = req.query.fields;
  
  var query = DB.Models.Club.findById(req.params.id);
  if (fields)
    query.select(fields.replace(/,/g, " "));
  query.exec(function (err, club) {
    if (err)
      return app.defaultError(res)(err);
    if (club === null)
      return app.defaultError(res)("no club found");
    res.send(JSON.stringifyModels(club));
  });
});

/**
 * Read games of a club
 * 
 * Generic options:
 *  /v2/clubs/:id/games/?limit=5     (default=10)
 *  /v2/clubs/:id/games/?offset=0    (default=0)
 *  /v2/clubs/:id/games/?sort=name   (default=-dates.start)
 * 
 * Specific options:
 *  /v2/clubs/:id/games/?status=ongoing   (default=created,ongoing,finished)
 * 
 * NON STANDARD URL, used by facebook app
 * default behaviour is to include the stream
 * 
 * no params
 */
app.get('/v2/clubs/:id/games/', function(req, res){
  var status = req.query.status || "created,ongoing,finished";
  var sort = req.query.sort || "-dates.start";
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  DB.Models.Club.findById(req.params.id, function (err, club) {
    if (err)
      return app.defaultError(res)(err);
    if (club === null)
      return app.defaultError(res)("no club found");
    var query = DB.Models.Game.find({});
    query.where('_searchablePlayersClubsIds', club);
    if (status)
      query.where('status').in(status.split(","));
    query.populate("teams.players")
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
 * Create a new club
 * 
 * Body {
 *   name: String,
 *   location: {
 *     city: String,
 *     pos: {type: [Number], index: '2d'},
 *     zip: String,
 *     address: String
 *   },
 *   fedid: String,
 *   ligue: String,
 *   outdoor: Number,
 *   indoor: Number,
 *   countPlayers: Number,
 *   countPlayers1AN: Number,
 *   countTeams: Number,
 *   countTeams1AN: Number,
 *   school: String
 * }
 * 
 * FIXME: who can create a club? owner?
 */
app.post('/v2/clubs/', express.bodyParser(), function(req, res){
  if (!req.body.name || !req.body.location || !req.body.location.city)
    return app.defaultError(res)("please provide club name & city");
  var data = {};
  
  Q.all([
    Q.ensure(Authentication.Query.getPlayer(req.query))
     .isNot(null, 'unauthorized')
     .inject(data, 'player'),
    Q.ninvoke(DB.Models.Club, 'findOne', { name: req.body.name, 'location.city': req.body.location.city })
     .inject(data, 'club')
  ]).then(function () {
      if (data.club)
        return app.defaultError(res)("club already registered");
      // creating a new club (no owner)
      req.body.location = (req.body.location) ? req.body.location : {};
      var club = new DB.Models.Club({
        sport: "tennis",
        name: req.body.name,
        location : {
          pos: req.body.location.pos || [],
          address: req.body.location.address || "",
          zip: req.body.location.zip || "",
          city: req.body.location.city || ""
        },
        ligue: req.body.ligue || ""
      });
      // owner
      club.owner = data.player.id;
      // might be undefined
      if (typeof req.body.fedid !== "undefined" && req.body.fedid)
        club.fedid = req.body.fedid;
      if (typeof req.body.outdoor !== "undefined")
        club.outdoor = parseInt(req.body.outdoor, 10);
      if (typeof req.body.indoor !== "undefined")
        club.indoor = parseInt(req.body.indoor, 10);
      if (typeof req.body.countPlayers !== "undefined")
        club.countPlayers = parseInt(req.body.countPlayers, 10);
      if (typeof req.body.countPlayers1AN !== "undefined")
        club.countPlayers1AN = parseInt(req.body.countPlayers1AN, 10);
      if (typeof req.body.countTeams !== "undefined")
        club.countTeams = parseInt(req.body.countTeams, 10);
      if (typeof req.body.countTeams1AN !== "undefined")
        club.countTeams1AN = parseInt(req.body.countTeams1AN, 10);
      if (typeof req.body.school !== "undefined")
        club.school = req.body.school;
      return DB.save(club);
    }).then(
      function (club) { res.send(JSON.stringifyModels(club)) },
      app.defaultError(res)
    );
});