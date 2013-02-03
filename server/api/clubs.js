var DB = require("../db.js")
  , express = require("express")
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
 @param     limit  [limit=5]                        /v1/clubs/autocomplete/?limit=5
 @param     fields [fields=nickname,name,type,club] /v1/clubs/autocomplete/?fields=nickname,name
 @param     sort   [sort=nickname]                  /v1/clubs/autocomplete/?sort=nickname
 
 @return array(clubs)
 
 @example
 * Autocomplete search in clubs
 * 
 * Generic options:
 *  /v1/clubs/autocomplete/?limit=5               (default=5)
 *  /v1/clubs/autocomplete/?fields=nickname,name  (default=name,location.city)
 *  /v1/clubs/autocomplete/?sort=nickname         (default=name)
 *  /v1/clubs/autocomplete/?longitude=40.234      (default=undefined)
 *  /v1/clubs/autocomplete/?latitude=40.456       (default=undefined)
 *  /v1/clubs/autocomplete/?distance=20           (default=undefined)
 *
 * Specific options:
 *  /v1/clubs/autocomplete/?q=Charlotte (searched text)
**/
app.get('/v1/clubs/autocomplete/', function(req, res){
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
    var query = DB.Model.Club
      .find({_searchableName: text})
      .select(fields.replace(/,/g, " "));
    if (longitude && latitude && distance)
      query.where('location.pos').within.centerSphere({ center: [ parseFloat(longitude), parseFloat(latitude) ], radius: parseFloat(distance) / 6378.137 });
    query.sort(sort.replace(/,/g, " "))
      .limit(limit)
      .exec(function (err, clubs) {
        if (err)
          return app.defaultError(res)(err);
        res.end(JSON.stringifyModels(clubs));
      });
  } else {
    res.end(JSON.stringify([]));
  }
});
  
/**
 * Read a club
 * 
 * Generic options:
 *  /v1/clubs/?fields=name
 */
app.get('/v1/clubs/:id', function(req, res){
  var fields = req.query.fields;
  
  var query = DB.Model.Club.findById(req.params.id);
  if (fields)
    query.select(fields.replace(/,/g, " "));
  query.exec(function (err, club) {
    if (err)
      return app.defaultError(res)(err);
    if (club === null)
      return app.defaultError(res)("no club found");
    res.end(JSON.stringifyModels(club));
  });
});

/**
 * Read games of a club
 * 
 * Generic options:
 *  /v1/clubs/:id/games/?limit=5     (default=10)
 *  /v1/clubs/:id/games/?offset=0    (default=0)
 *  /v1/clubs/:id/games/?sort=nickname (default=-dates.start)
 * 
 * Specific options:
 *  /v1/clubs/:id/games/?status=ongoing   (default=ongoing,finished)
 * 
 * NON STANDARD URL, used by facebook app
 * default behaviour is to include the stream
 * 
 * no params
 */
app.get('/v1/clubs/:id/games/', function(req, res){
  var status = req.query.status || "ongoing,finished";
  var sort = req.query.sort || "-dates.start";
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  DB.Model.Club.findById(req.params.id, function (err, club) {
    if (err)
      return app.defaultError(res)(err);
    if (club === null)
      return app.defaultError(res)("no club found");
    var query = DB.Model.Game.find({});
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
         res.end(JSON.stringifyModels(games));
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
 *     address: String
 *   },
 *   fftid: String,
 *   ligue: String,
 *   zip: String,
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
app.post('/v1/clubs/', express.bodyParser(), function(req, res){
  if (req.body.name) {
    // creating a new club (no owner)
    req.body.location = (req.body.location) ? req.body.location : {};
    var club = new DB.Model.Club({
      sport: "tennis",
      name: req.body.name,
      location : {
        pos: req.body.location.pos || [],
        address: req.body.location.address || "",
        city: req.body.location.city || ""
      },
      fftid: req.body.fftid || "",
      ligue: req.body.ligue || "",
      zip: req.body.zip || ""
    });
    // might be undefined
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
    DB.saveAsync(club)
      .then(
        function (club) { res.end(JSON.stringifyModels(club)) },
        app.defaultError(res)
      );
  } else {
    app.defaultError(res)("please provide club name");
  }
});