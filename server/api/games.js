var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Q = require("q")
  , mongoose = require("mongoose")
  , ObjectId = mongoose.Types.ObjectId;


/**
 * Read games
 * a bit complex due to "populate" option.
 * 
 * Generic options:
 *  /v1/games/?limit=10              (default=10)
 *  /v1/games/?offset=0              (default=0)
 *  /v1/games/?fields=nickname,name  (default=)
 *  /v1/games/?sort=date_start      (default=date_start)
 *
 * Specific options:
 *  /v1/games/?q=text                (Mandatory)
 *  /v1/games/?club=:id
 *  /v1/games/?populate=teams.players (default=teams.players)
 * 
 * only query games with teams
 * auto-populate teams.players
 * 
 * fields filter works with populate : (...)?fields=teams.players.name
 */
app.get('/v1/games/', function(req, res){
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  var text = req.query.q;
  var club = req.query.club || null;
  var fields = req.query.fields || "date_creation,date_start,date_end,owner,pos,country,city,sport,type,status,sets,score,teams,teams.players.name,teams.players.nickname,teams.players.club,teams.players.rank";
  var sort = req.query.sort || "date_start";
  // populate option
  var populate = "teams.players";
  if (typeof req.query.populate !== "undefined")
    populate = req.query.populate;
  var populatePaths = (typeof populate === "string") ? populate.split(",") : [];

  // process fields
  var fields = app.createPopulateFields(fields, populate);
  // heavy...
  var query = DB.Model.Game.find({});
  if (text) {
    text = new RegExp("("+text.searchable().pregQuote()+")");
    query.or([
      { _citySearchable: text },
      { _searchablePlayersNames: text },
      { _searchablePlayersNickNames: text },
      { _searchablePlayersClubsNames: text }
    ]);
  }
  if (club)
    query.where('_searchablePlayersClubsIds', club);
  query.select(fields.select);
  if (populatePaths.indexOf("teams.players") !== -1) {
    query.populate("teams.players", fields["teams.players"]);
  }
  query.sort(sort.replace(/,/g, " "))
       .skip(offset)
       .limit(limit)
       .exec(function (err, games) {
      if (err)
        return app.defaultError(res)(err);
      res.end(JSON.stringifyModels(games));
    });
});


/**
 * Read a game
 * a bit complex due to "populate" option.
 * 
 * Generic options:
 *  /v1/games/:id/?fields=nickname,name
 *
 * Specific options:
 *  /v1/games/:id/?populate=teams.players
 *  /v1/games/:id/?stream=true
 */
app.get('/v1/games/:id', function (req, res){
  var fields = req.query.fields || "date_creation,date_start,date_end,owner,pos,country,city,sport,type,status,sets,score,teams,teams.players.name,teams.players.nickname,teams.players.club,teams.players.rank,teams.players.email";
  if (req.query.stream === "true")
    fields += ",stream"
  // populate option
  var populate = "teams.players";
  if (typeof req.query.populate !== "undefined")
    populate = req.query.populate;
  var populatePaths = (typeof populate === "string") ? populate.split(",") : [];

  // preprocess fields
  var fields = app.createPopulateFields(fields, populate);
  // searching player by id.
  var query = DB.Model.Game.findOne({_id:req.params.id})
     .select(fields.select);
  if (populatePaths.indexOf("teams.players") !== -1) {
    query.populate("teams.players", fields["teams.players"]);
  }
  query.exec(function (err, game) {
    if (err)
      return app.defaultError(res)(err);
    if (game === null)
      return app.defaultError(res)("no game found");
    // should we hide the owner ?
    res.end(JSON.stringifyModels(game));
  });
});

/*
 * Create a game
 *
 * You must be authentified
 * You must give 2 teams
 * 
 * /!\ Default output will be have teams.players populated
 * 
 * Body {
 *   pos: String,         (default="")
 *   country: String,     (default=not exist)
 *   city: String,        (default="")
 *   sport: String,       (default="tennis")
 *   status: String       (default="ongoing")
 *   sets: String         (default="")
 *   score: String        (default="")
 *   teams: [
 *     {
 *       points: String,  (default="")
 *       players: [
 *         ObjectId,      (default=not exist)            teams.players can be id
 *         { name: "owned player" } (default=not exist)   or objects
 *       ]
 *     }
 *   ]
 * }
 * 
 * result is a redirect to /v1/games/:newid
 */
app.post('/v1/games/', express.bodyParser(), function (req, res) {
  var err = DB.Model.Game.checkFields(req.body, ["sport", "type", "status", "teams"]);
  if (err)
    return app.defaultError(res)(err);
  DB.isAuthenticatedAsync(req.query)
    .then(function checkPlayersExists(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      // players id exist
      // owned player are created
      // => creating game
      var game = new DB.Model.Game({
        owner: authentifiedPlayer.id,
        pos: req.body.pos || [],
        country: req.body.country || "",
        city: req.body.city || "",
        sport: req.body.sport || "tennis",
        type: "singles",
        status: req.body.status || "ongoing",
        sets: req.body.sets || "",
        score: req.body.score || "",
        teams: [ // game has 2 teams (default)
          { points: "", players: [] },
          { points: "", players: [] }
        ],
        stream: []
      });
      return DB.Model.Game.updateTeamsAsync(game, req.body.teams);
    }).then(function saveAsync(game) {
      return DB.saveAsync(game);
    }).then(function sendGame(game) {
      app.internalRedirect('/v1/games/:id')(
        {
          query: { },
          params: { id: game.id }
        },
        res);
    }, app.defaultError(res));
});

/*
 * Update a game
 *
 * You must be authentified
 * 
 * FIXME: unoptimized, no fields options yet.
 * 
 * /!\ Default output will be have teams.players populated
 * 
 * Body {
 *   pos: String,         (default="")
 *   country: String,     (default=not exist)
 *   city: String,        (default="")
 *   status: String       (default="ongoing")
 *   sets: String         (default="")
 *   score: String        (default="")
 *   teams: [
 *     {
 *       points: String,  (default="")
 *       players: [
 *         ObjectId,      (default=not exist)            teams.players can be id
 *         { name: "owned player" } (default=not exist)   or objects
 *       ]
 *     }
 *   ]
 * }
 * 
 * result is a redirect to /v1/games/:newid
 */
app.post('/v1/games/:id', express.bodyParser(), function(req, res){
  var err = DB.Model.Game.checkFields(req.body, ["sport", "type", "status", "teams"]);
  if (err)
    return app.defaultError(res)(err);
  // check player is authenticated
  var owner = null;
  DB.isAuthenticatedAsync(req.query)
    .then(function searchGame(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      owner = authentifiedPlayer.id;
      // somme more security tests
      var deferred = Q.defer();
      DB.Model.Game.findById(req.params.id, function (err, game) {
        if (err)
          return deferred.reject(err);
        if (game === null)
          return deferred.reject("game doesn't exist");
        if (game.owner != req.query.playerid) // /!\ cant do '!==' on objectId
          return deferred.reject("you are not the owner of the game : "+game.owner+" " + req.query.playerid);
        deferred.resolve(game);
      });
      return deferred.promise;
    }).then(function updateFields(game) {
      // updatable simple fields
      [ "country", "city", "type", "status", "sets", "score" ].forEach(
        function (o) {
          if (typeof req.body[o] !== "undefined")
            game[o] = req.body[o];
        }
      );
      //
      return DB.Model.Game.updateTeamsAsync(game, req.body.teams);
    }).then(function update(game) {
      return DB.saveAsync(game);
    }).then(function sendGame(game) {
      app.internalRedirect('/v1/games/:id')(
        {
          query: { },
          params: { id: game.id }
        },
        res);
    }, app.defaultError(res));
});

/*
 * Post in the stream
 *
 * You must be authentified
 * 
 * WARNING WARNING WARNING
 *  DO NOT TRUST THE RESULT
 *  might have race conditions on result.
 * WARNING WARNING WARNING
 * 
 * Body {
 *     type: "comment",   (default="comment")
 *     owner: ObjectId    (must equal ?playerid)
 *     data: { text: "..." }
 *   }
 * }
 */
app.post('/v1/games/:id/stream/', express.bodyParser(), function(req, res){
  if (req.body.type !== "comment")
    return app.defaultError(res)("type must be comment");
  DB.isAuthenticatedAsync(req.query)
    .then(function checkGameExist(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      var deferred = Q.defer();
      DB.Model.Game.findById(req.params.id, function (err, game) {
        if (err)
          return deferred.reject(err);
        if (game === null)
          return deferred.reject("can't find game");
        return deferred.resolve(game);
      });
      return deferred.promise;
    }).then(function pushIntoStream(game) {
      // FIXME: performance issue here...
      //  we should be using { $push: { stream: streamItem } }
      //  but there are 2 problems :
      //   - how can we get the new _id with $push api ? (need to read using slice -1 ? might be race conditions :(
      //   - seems to be a bug: no _id is created in mongo :(
      var streamItem = {};
      streamItem.type = "comment";
      streamItem.owner = req.query.playerid;
      // adding text
      if (req.body.data && req.body.data.text)
        streamItem.data = { text: req.body.data.text };
      game.stream.push(streamItem);
      return DB.saveAsync(game);
    }).then(function sendGame(game) {
      if (game.stream.length === 0)
        throw "no streamItem added";
      res.end(JSON.stringifyModels(game.stream[game.stream.length - 1]));
    }, app.defaultError(res));
});
