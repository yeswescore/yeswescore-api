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
 *  /v1/games/?club=:id
 * 
 * only query games with teams
 * auto-populate teams.players
 */
app.get('/v1/games/', function(req, res){
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  var text = req.query.q;
  var club = req.query.club || null;
  var fields = req.query.fields || "date_start,pos,country,city,type,status,sets,teams,teams.players.name,teams.players.nickname,teams.players.club";
  var sort = req.query.sort || "date_start";

  if (!text)
    return res.end(JSON.stringify([]));
  text = new RegExp("("+text.searchable().pregQuote()+")");
  // preprocess fields
  var teamPlayersFields = fields.split(',').filter(function (field) {
      return field.startsWith("teams.players.");
    }).map(function (field) {
      return field.replace("teams.players.", "");
    }).join(" ");
  var gameFields = fields.split(',').filter(function (field) {
      return !field.startsWith("teams.players.");
    }).join(" ");
  // heavy...
  var query = DB.Model.Game.find({})
    .or([
      { _citySearchable: text },
      { _searchablePlayersNames: text },
      { _searchablePlayersNickNames: text },
      { _searchablePlayersClubsNames: text },
      { _searchablePlayersClubsIds: club }
    ])
    .select(gameFields)
    .populate("teams.players", teamPlayersFields)
    .sort(sort.replace(/,/g, " "))
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
  var populate = req.query.populate;
  var populatePaths = (typeof populate === "string") ? populate.split(",") : [];
  var fields = req.query.fields;
  
  // searching player by id.
  var query = DB.Model.Game.findOne({_id:req.params.id});
  if (fields)
      query.select(fields.replace(/,/g, " "))
  if (populatePaths.indexOf("teams.players") !== -1)
    query.populate("teams.players");
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

// writing a new entry in the stream
// POST /v1/games/:id/stream/?id=...&token=...
app.post('/v1/games/:id/stream/', express.bodyParser(), function(req, res){
  /*       {
  *          id: checksum,
  *          date: string,
  *          type: "comment",
  *          owner: id,
  *          data: { text: "...." }
  *        }
  */
  if (!DB.isAuthenticated(req.query)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "unauthorized"}));
    return; // FIXME: error
  }
  var game = DB.searchById(DB.games, req.params.id);
  if (!game) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "game not found"}));
    return; // FIXME: error
  }
  if (req.body.type !== "comment" || typeof req.body.data === "undefined") {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "wrong format"}));
    return; // FIXME: error
  }
  // we can post anything in a stream
  var streamObj = {
    id: DB.generateFakeId(),
    date: new Date().toISO(),
    owner: req.query.playerid
  };
  // should copy type & data
  for (var i in req.body) {
    if (typeof streamObj[i] === "undefined")
      streamObj[i] = req.body[i];
  }
  // adding comment to stream
  game.stream.push(streamObj);
  // sending back saved data to the client
  var body = JSON.stringify(streamObj);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});