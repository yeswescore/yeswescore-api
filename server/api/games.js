var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Q = require("q");


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
  var fields = req.query.fields || "date_creation,date_start,date_end,owner,pos,country,city,sport,type,status,sets,teams,teams.players.name,teams.players.nickname,teams.players.club";
  var sort = req.query.sort || "date_start";
  // populate option
  var populate = "teams.players";
  if (typeof req.query.populate !== "undefined")
    populate = req.query.populate;
  var populatePaths = (typeof populate === "string") ? populate.split(",") : [];

  if (!text)
    return res.end(JSON.stringify([]));
  text = new RegExp("("+text.searchable().pregQuote()+")");
  // process fields
  var fields = app.createPopulateFields(fields, populate);
  // heavy...
  var query = DB.Model.Game.find({})
    .or([
      { _citySearchable: text },
      { _searchablePlayersNames: text },
      { _searchablePlayersNickNames: text },
      { _searchablePlayersClubsNames: text },
      { _searchablePlayersClubsIds: club }
    ])
    .select(fields.select);
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
 */
app.get('/v1/games/:id', function(req, res){
  var fields = req.query.fields || "date_creation,date_start,date_end,owner,pos,country,city,sport,type,status,sets,teams,teams.players.name,teams.players.nickname,teams.players.club";
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
 * Body {
 *   pos: String,         (default="")
 *   country: String,     (default=not exist)
 *   rank: String,        (default="")
 *   club: { id:..., name:... }  (default=null, name: is ignored)
 *   type: String      (enum=default,owned default=default)
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
 */
app.post('/v1/games/', express.bodyParser(), function (req, res) {
  var err = DB.Model.Game.checkFields(req.body, ["sport", "type", "status", "teams"]);
  if (err)
    return app.defaultError(res)(err);
  DB.isAuthenticatedAsync(req.query)
    .then(function checkPlayersExists(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      return DB.Model.Game.checkTeamsPlayersExistAsync(req.body);
    }).then(function createOwnedAnonymousPlayers() {
      return DB.Model.Game.createOwnedAnonymousPlayersAsync(req.body);
    }).then(function createGame() {
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
        sets: req.body.sets || "",
        teams: req.body.teams,
        stream: []
      });
      return DB.saveAsync(game);
    }).then(function sendGame(game) {
      res.end(JSON.stringifyModels(game));
    }, app.defaultError(res));
});

app.post('/v1/games/:id', express.bodyParser(), function(req, res){
  var err = DB.Model.Game.checkFields(req.body, ["sport", "type", "status", "teams"]);
  if (err)
    return app.defaultError(res)(err);
  // check body id
  if (req.params.id !== req.body.id)
     return app.defaultError(res)("body.id should equal params.id");
  // check player is authenticated
  DB.isAuthenticatedAsync(req.query)
    .then(function searchGame(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      // somme more security tests
      var deferred = Q.defer();
      DB.Model.Game.findById(req.body.id, function (err, game) {
        if (err)
          return deferred.reject(err);
        if (game === null)
          return deferred.reject("game doesn't exist");
        if (game.owner !== req.query.playerid)
          return deferred.reject("you are not the owner of the game");
        deferred.resolve(game);
      });
      return deferred.promise;
    }).then(function updateFields(game) {
      // updatable simple fields
      [ "country", "city", "type", "status", "sets" ].forEach(
        function (o) {
          if (typeof req.body[o] !== "undefined")
            game[o] = req.body[o];
        }
      );
      // updatable teams field
      var deferred = Q.defer();
      if (typeof req.body.teams !== "undefined")
      {
        DB.Model.Game.checkTeamsPlayersExistAsync(req.body)
                     .then(function () {
                       return DB.Model.Game.createOwnedAnonymousPlayersAsync(req.body)
                     }).then(
                       function () { deferred.resolve() },
                       function () { deferred.reject()  }
                     );
      }
      else
      {
        deferred.resolve();
      }
      return deferred.promise;
    }).then(function update(game) {
      return DB.saveAsync(game);
    }).then(function sendGame(game) {
      res.end(JSON.stringifyModels(game));
    }, app.defaultError(res));
});

/*
 * Post in the stream
 *
 * You must be authentified
 * 
 * Body {
 *     type: "comment",   (default="comment")
 *     owner: ObjectId    (must equal ?playerid)
 *     data: { text: "..." }
 *   }
 * }
 */
app.post('/v1/games/:id/stream/', express.bodyParser(), function(req, res){
  DB.isAuthenticatedAsync(req.query)
    .then(function checkGameExist(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      var deferred = Q.defer();
      DB.Model.Game.findById(query.params.id, function (err, game) {
        if (err)
          return deferred.reject(err);
        if (game === null)
          return deferred.reject("can't find game");
        return deferred.resolve(game);
      });
      return deferred.promise;
    }).then(function pushIntoStream(game) {
      var streamItem = {};
      // creating fields
      streamItem.type = "comment";
      streamItem.owner = req.query.playerid;
      // adding text
      if (req.body.data && req.body.data.text)
        streamItem.data = { text: req.body.data.text };
      var deferred = Q.defer();
      DB.Model.game.findByIdAndUpdate(
        game._id,
        { $push: { streams: streamItem } },
        function (err, unknownObj) {
          if (err)
            return deferred.reject(err);
          return deferred.resolve(unknownObj);
        }
      );
      return deferred.promise;
    }).then(function (unknownObj) {
      res.end(JSON.stringifyModels(unknownObj));
    }, app.defaultError(res));
});