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
 *  /v1/games/?order=date_start      (default=date_start)
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
  var club = req.query.club;
  var fields = req.query.fields;
  var order = req.query.order || "date_start";

  if (!text)
    return res.end(JSON.stringify([]));
  text = new RegExp("("+text.searchable().pregQuote()+")");
  // heavy...
  var query = DB.Model.Game.find({
    $or : [
      { _citySearchable: text },
      { _searchablePlayersNames: text },
      { _searchablePlayersNickNames: text },
      { _searchablePlayersClubsNames: text }
    ]
  });
  if (fields)
      query.select(fields.replace(/,/g, " "))
  query.populate("teams.players", null, club? {"club.id": club} : {})
       .sort(order.replace(/,/, " "))
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
  // check sport
  if (req.body.sport && req.body.sport !== "tennis")
    return app.defaultError(res)("wrong sport (tennis only)");
  // check type
  if (req.body.type && req.body.type !== "singles")
    return app.defaultError(res)("wrong type (singles only)");
  // check status
  if (req.body.status && req.body.status !== "ongoing" && req.body.status !== "finished")
    return app.defaultError(res)("wrong status (ongoing/finished)");
  // check teams
  var teams = req.body.teams;
  if (!Array.isArray(teams) || teams.length !== 2)
    return app.defaultError(res)("teams format");
  // check teams.players
  var ok = teams.every(function (team) {
    return Array.isArray(team.players) &&
           team.players.every(function (player) {
             return typeof player === "string" ||
                    (typeof player === "object" &&
                     typeof player.name !== "undefined");
           });
  });
  if (!ok) {
    return app.defaultError(res)("teams.players format");
  }
  DB.isAuthenticatedAsync(req.query)
    .then(function checkPlayersExists(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      var playersId = teams.players.reduce(function (p, team) {
        return team.players.map(function (player) {
          if (typeof player === "string")
            return player;
          return player.id;
        }).filter(function (playerId) { return playerId });
      }, []);
      return DB.existAsync(DB.Model.Player, playersId);
    }).then(function createOwnedAnonymousPlayers(exist) {
      if (!exist)
        throw "some player doesn't exist";
      // creating all owned anonymous players
      var promises = [];
      for (var teamIndex = 0; teamIndex < teams.length; ++teamIndex) {
        var team = teams[teamIndex];
        var players = team.players;
        for (var playerIndex = 0; playerIndex < players.length; ++playerIndex) {
          var player = players[playerIndex];
          if (typeof player !== "string" &&
              typeof player.id !== "string") {
            // creating owned anonymous player
            (function createOwnedAnonymousPlayer(teamIndex, playerIndex) {
              var p = new DB.Model.Player({
                name: player.name || "",
                nickname: player.nickname || "",
                type: "owned",
                owner: authentifiedPlayer.id
              });
              promises.push(DB.saveAsync(player)
                              .then(function (player) {
                                teams[teamIndex].players[playerIndex] = player.id;
                              }));
            })(teamIndex, playerIndex);
          }
        }
      }
      return Q.all(promises);
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
  if (!DB.isAuthenticated(req.query)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "unauthorized"}));
    return; // FIXME: error
  }
  //
  var game = DB.searchById(DB.games, req.params.id);
  if (!game) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "game doesn't exist"}));
    return; // FIXME: error
  }
  if (req.query.playerid !== game.owner) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "you are not the owner of the game"}));
    return; // FIXME: error
  }
  // update des champs updatables.
  [ "city", "type", "sets", "score", "status", "teams" ].forEach(
    function (o) {
      if (typeof req.body[o] !== "undefined")
        game[o] = req.body[o];
    }
  );
  // sending back saved data to the client
  var body = JSON.stringify(game);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
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