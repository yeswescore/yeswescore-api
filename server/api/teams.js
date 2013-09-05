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

  var query = DB.Models.Team.find()
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
    var query = DB.Models.Team.find();
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
  var query = DB.Models.Team.findById(req.params.id);
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
 * Read a team stream
 *   sorting item by date_creation.
 *
 * The team stream is private to team members
 *
 * Generic options:
 *  /v2/teams/:id/stream/?limit=5       (default=10)
 *
 * Specific options:
 *  /v2/teams/:id/stream/?after=date    ex: "16:01:2013" ou "16 janvier 2013" ou...
 *  /v2/teams/:id/stream/?lastid=...    recherche ts les elements depuis tel ou tel id
 *
 * WARNING: might be performance hits. We can't use $elemMatch (see below).
 * FIXME: solution: create a separate collection for the stream.
 */
app.get('/v2/teams/:id/stream/', function (req, res){
  var limit = req.query.limit || 10;
  var after = req.query.after || null;
  var lastid = req.query.lastid || null;
  var data = { };

  Q.all([
    Authentication.Query.authentify(req.query),
    Q.ensure(Q.ninvoke(DB.Models.Team, "findOne", {_id:req.params.id, _deleted: false}))
     .isNot(null, "team not found")
     .inject(data, "team")
  ]).then(function () {
    var team = data.team;
    
    // privacy: only team members can read the stream
    // FIXME: might be security issues here with /v2/teams/:id/?fields=...
    var ownersIds = DB.Models.Team.getOwnersIds(team);
    if (ownersIds.indexOf(req.query.playerid) === -1)
      throw "auth player must be a player/substitute/captain/captainSubstitute or coach";

    // we select the stream & filter using javascript.
    // this cannot be done at the driver level using something like
    // > query.select({ stream: { $elemMatchAll: { 'dates.creation' : { $gte: new Date(after) } } } });
    // because $elemMatchAll doesn't exist & $elemMatch only return 1 result.
    // @øee http://docs.mongodb.org/manual/reference/projection/elemMatch/#_S_elemMatch
    // @see https://jira.mongodb.org/browse/SERVER-6612

    var stream = team.stream || [];
    // filtering
    stream = stream.filter(function (s) {
      return s._deleted === false;
    });

    // after
    if (after) {
      after = new Date(after).getTime();
      stream = stream.filter(function (streamItem) {
        return new Date(streamItem.dates.creation).getTime() >= after;
      });
    }

    // lastid
    if (lastid) {
      stream = stream.filter(function (streamItem) {
        return streamItem.id > lastid;
      });
    }

    // sorting by date (new to old)
    stream.sort(function (a, b) {
      if (a.dates.creation < b.dates.creation)
        return 1;
      if (a.dates.creation > b.dates.creation)
        return -1;
      return 0;
    });

    // limit
    stream = stream.filter(function (streamItem, index) {
      return index < limit;
    });

    // populating owners
    // FIXME: should be optimized.
    var playersPromises = stream.map(function (streamItem) {
      if (streamItem.owner.player)
        return Q.ninvoke(DB.Models.Player, "findById", streamItem.owner.player);
      return Q.wrap(null); // facebook
    });

    return Q.all(playersPromises).then(
      function (players) {
        // remplacing :
        //     { owner: { player: "512fd6227293e00f60000026" } }
        //  or { owner: { facebook: { id: "7293e00f6", name: "..." } } }
        //
        // to:
        //
        //     { owner: { player: { id: "...", name: "..." } } }
        //  or { owner: { facebook: { id: "7293e00f6", name: "..." } } }
        stream = stream.map(function (streamItem, index) {
          // FIXME: mongoose missing feature.
          // How to populate a model property manually after instantiation?
          // https://groups.google.com/forum/?fromgroups=#!topic/mongoose-orm/nrBq_gOVzBo
          var streamItemObject = streamItem.toObject({virtuals: true, transform: true});
          var player = players[index];
          if (player) {
            var playerId = streamItemObject.owner.player;
            streamItemObject.owner.player = {
              id: playerId,
              name: player.name
            };
          }
          return streamItemObject;
        });

        // FIXME: should be stringifyModels when mongoose will be fixed.
        res.send(JSON.stringify(stream));
    });
  }, app.defaultError(res));
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
  var ownersIds = DB.Models.Team.getOwnersIds(req.body);
  if (ownersIds.indexOf(req.query.playerid) === -1)
    return app.defaultError(res)("owner must be a player/substitute/captain/captainSubstitute or coach");
  var data;
  DB.Models.Team.checkFields(req.body)
   .then(Authentication.Query.authentify(req.query))
   .ensure(DB.Models.Club.existOrEmpty(req.body.club)).isNot(false, "club error")
   .ensure(DB.Models.Player.existOrEmpty(ownersIds)).isNot(false, "owner error")
   .then(function () {
      var team = new DB.Models.Team({
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
      return DB.save(team);
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
  var ownersIds = DB.Models.Team.getOwnersIds(req.body)
    , data = { team: null };
  // check if "owner" is in players/substitutes/captain/captainSubstitute/coach
  if (ownersIds.indexOf(req.query.playerid) === -1)
    return app.defaultError(res)("owner must be a player/substitute/captain/captainSubstitute or coach");
  // 4 checks
  Q.all([
    // player is correctly authentified & exist in DB
    DB.Models.Team.checkFields(req.body)
      .then(Authentication.Query.authentify(req.query)),
    // club (if submited) exist in DB
    Q.ensure(DB.Models.Club.existOrEmpty(req.body.club))
     .isNot(false, "club error"),
    // every players submited exist in DB (heavy)
    Q.ensure(DB.Models.Player.existOrEmpty(ownersIds))
     .isNot(false, "owner error"),
    // the team also exist in DB.
    Q.ensure(Q.ninvoke(DB.Models.Team, 'findById', req.params.id))
     .isNot(null, "unknown team")
     .inject(data, "team")
  ]).then(function () {
    var team = data.team;
    // security, is playerid an ownersIds ?
    var dbOwnersIds = DB.Models.Team.getOwnersIds(team);
    console.log('team owners : ' + JSON.stringify(dbOwnersIds) + ' vs ' + req.query.playerid);
    if (dbOwnersIds.indexOf(req.query.playerid) === -1)
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
      team.captain = (req.body.captain) ? req.body.captain : undefined;
    if (typeof req.body.captainSubstitute !== "undefined")
      team.captainSubstitute = (req.body.captainSubstitute) ? req.body.captainSubstitute : undefined;
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

/*
 * Post in the stream
 *
 * You must be authentified
 * You must be part of the team !
 *
 * WARNING WARNING WARNING
 *  DO NOT TRUST THE RESULT
 *  might have race conditions on result.
 * WARNING WARNING WARNING
 *
 * Body {
 *   type: "comment",   (default="comment")
 *   owner: { player: ObjectId, facebook: { id: "...", name: "..." } }
 *   data: { text: "..." }
 * }
 */
app.post('/v2/teams/:id/stream/', express.bodyParser(), function(req, res){
  var data = { };;
  
  // input validation
  if (req.body.type !== "comment" && req.body.type !== "image")
    return app.defaultError(res)("type must be comment or image "+req.body.type);
  //
    console.log('recherche team : ' + req.params.id);
  Q.all([
    Authentication.Query.authentify(req.query),
    Q.ensure(Q.ninvoke(DB.Models.Team, "findOne", {_id:req.params.id, _deleted: false}))
     .isNot(null, "team not found")
     .inject(data, "team")
  ]).then(function pushIntoStream() {
    var team = data.team;
    
    // privacy: only team members can post
    var ownersIds = DB.Models.Team.getOwnersIds(team);
    if (ownersIds.indexOf(req.query.playerid) === -1)
      throw "auth player must be a player/substitute/captain/captainSubstitute or coach";
    
    // FIXME: performance issue here...
    //  we should be using { $push: { stream: streamItem } }
    //  but there are 2 problems :
    //   - how can we get the new _id with $push api ? (need to read using slice -1 ? might be race conditions :(
    //   - seems to be a bug: no _id is created in mongo :(
    var streamItem = {};
    streamItem.type = req.body.type;
    streamItem.owner = { player: req.query.playerid };
    // adding data
    if (req.body.type === "comment" &&
        req.body.data && req.body.data.text)
      streamItem.data = { text: req.body.data.text };
    if (req.body.type === "image" &&
        req.body.data && req.body.data.id)
      streamItem.data = { id: req.body.data.id };

    team.stream.push(streamItem);
    team.dates.update = Date.now();
    return DB.save(team);
    }).then(function incr(team) {
      if (req.body.type === "comment")
        return Q.ninvoke(DB.Models.Team, "findByIdAndUpdate", team.id, { $inc: { streamCommentsSize: 1 } });
      else
        return Q.ninvoke(DB.Models.Team, "findByIdAndUpdate", team.id, { $inc: { streamImagesSize: 1 } });
    }).then(function sendGame(team) {
      if (team.stream.length === 0)
        throw "no streamItem added";
      res.send(JSON.stringifyModels(team.stream[team.stream.length - 1]));
    }, app.defaultError(res));
});

/*
 * Update a streamitem
 *
 * You must be authentified
 * You must be part of the team
 *
 * Body {
 *   data: { text: "..." }
 * }
 *
 * This code is not performant.
 */
app.post('/v2/teams/:id/stream/:streamid/', express.bodyParser(), function(req, res){
  var data = { };
  
  Q.all([
    Authentication.Query.authentify(),
    Q.ensure(Q.ninvoke(DB.Models.Team, "findOne", {_id:req.params.id, _deleted: false}))
     .isNot(null, "team not found")
     .inject(data, "team")
  ]).then(function (team) {
      // search the streamItem
      if (!Array.isArray(team.stream))
        throw "empty stream";
      var streamid = req.params.streamid
        , l = team.stream.length;
      for (var i = 0; i < l; ++i) {
        var streamItem = team.stream[i];
        if (streamItem._id != streamid)
          continue;
        // streamItem found => owned ?
        if (DB.toStringId(req.query.playerid) !== DB.toStringId(streamItem.owner.player))
          throw "you don't own this streamitem";
        // update the streamItem
        if (req.body.data && req.body.data.text)
          team.stream[i].data = { text: req.body.data.text };
        team.stream[i].dates.update = Date.now();
        return DB.save(team);
      }
      throw "no streamItem found";
    }).then(function (team) {
      var streamid = req.params.streamid
        , l = team.stream.length;
      for (var i = 0; i < l; ++i) {
        if (team.stream[i]._id == streamid) {
          var streamItem = team.stream[i].toObject({virtuals: true, transform: true});
          return res.send(JSON.stringify(streamItem));
        }
      }
      // we normaly shouldn't reach this point.
      throw "unknown exception";
    }, app.defaultError(res));
});
