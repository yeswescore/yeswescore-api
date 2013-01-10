var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js");


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
  var query = DB.Model.Game.find({});
  if (fields)
      query.select(fields.replace(/,/g, " "))
  // populate
  var populateCondition = {
    $or: [
      { _nicknameSearchable: text },
      { _nameSearchable: text }
    ]
  };
  // condition on club
  if (club) {
    populateCondition = { $and: [
        populateCondition,
        { "club.id": club }
      ]
    }
  }
  query.populate("teams.players", null, populateCondition)
       .where("_citySearchable", text)
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
 *  /v1/games/:id/?populate=team.players,team.players.club
 */
app.get('/v1/games/:id', function(req, res){
  var populate = req.query.populate;
  var fields = req.query.fields;
  
  var query = DB.Model.Game.findOne({_id:req.params.id});
  if (fields)
      query.select(fields.replace(/,/g, " "))
  query.exec(function (err, game) {
    if (err)
      return app.defaultError(res)(err);
    if (game === null)
      return app.defaultError(res)("no game found");
    // must populate manually
    var populatePaths = (typeof populate === "string") ? populate.split(",") : [];
    if (populatePaths.indexOf("teams.players") === -1)
      return res.end(JSON.stringifyModels(game));
    
    // populate: we need to read players
    var q = DB.Model.Player.find({});
    // var or = [ { _id: .. }, { _id: .. }, ... ]
    var or = game.teams.reduce(function (p, team) {
      return p.concat(team.players.map(function (player) {
        return { _id: player };
      }));
    }, []);
    q.or(or);
    if (populatePaths.indexOf("teams.players.club") !== -1)
      q.populate("club");
    q.exec(function (err, players) {
      if (err)
        return app.defaultError(res)(err, "populate error");
      game.teams.forEach(function (team, teamIndex) {
        team.players.forEach(function (playerId, playerIndex) {
          for (var i = 0; i < players.length; ++i) {
            if (players[i].id == playerId) { // /!\ cannot use ===
              game.teams[teamIndex].players[playerIndex] = players[i];
            }
          }
        });
      });
      res.end(JSON.stringifyModels(game));
    });
  });
});



/* creation partie
* POST /v1/games/?playerid=...&token=...
* {
*   players : [
*      {
*        id: null/string
*        nickname: string
*        rank:
*      }
*   ]
* }
*/
app.post('/v1/games/', express.bodyParser(), function (req, res) {  
  // on verifie que l'owner est authentifie
  if (!DB.isAuthenticated(req.query)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "unauthorized"}));
    return; // FIXME: error
  }

  /*
  * document game:
  * {
  *   id: string, // checksum hexa
  *   date_creation: string, // date iso 8601
  *   date_start: string, // date iso 8601
  *   date_end: string, // date iso 8601
  *   owner,
  *   pos: { long: float, lat: float }, // index geospatial
  *   country: string,
  *   city: string,
  *   type: string, // singles / doubles
  *   sets: string, // ex: 6,2;6,3  (precomputed)
  *   status: string, // ongoing, canceled, finished (precomputed)
  *   teams: [
  *     string, // id
  *     string  // id
  *   ],
  *   stream: [
  *       FIXME: historique du match, action / date / heure / commentaire / video / photo etc
  *   ]
  */
  // si aucune teams, on cree 2
  if (!Array.isArray(req.body.teams))
    req.body.teams = [{}, {}]; // double team vide.s
  // on cree la partie
  var game = {
    id: DB.generateFakeId(),
    date_creation: new Date().toISO(),
    date_start: new Date().toISO(),
    date_end: null,
    owner: req.query.playerid,
    teams: req.body.teams.map(function (teamInfo) {
        if (typeof teamInfo.players !== "undefined" &&
            Array.isArray(teamInfo.players) &&
            typeof teamInfo.players[0] !== "undefined" &&
            typeof teamInfo.players[0].id !== "undefined" &&
            DB.searchById(DB.players, teamInfo.players[0].id))
          return { id:null, points:null, players: [ { id: teamInfo.players[0].id } ] };
        if (typeof teamInfo.players !== "undefined" &&
            Array.isArray(teamInfo.players) &&
            typeof teamInfo.players[0] !== "undefined" &&
            typeof teamInfo.players[0].name !== "undefined")
          return { id:null, points:null, players: [ { name: teamInfo.players[0].name } ] };
        return { id:null, points:null, players: [ { name: "" } ] };
    }),
    type: "singles",
    status: "ongoing",
    pos: null,
    country: null,
    city: null,
    sets: null,
    status: "ongoing",
    score: null,
    sport: "tennis",
    stream: []
  };
  // ttes les autres options que le client peut surcharger
  // FIXME: whitelist.
  ["country", "city", "sets", "score"].forEach(function (i) {
    if (typeof req.body[i] !== "undefined")
      game[i] = req.body[i];
  });
  // status
  if (typeof req.body["status"] !== "undefined" &&
      (req.body["status"] === "finished"  ||
      req.body["status"] === "ongoing")) {
    game["status"] = req.body.status;
  }
  // pos
  if (typeof req.body["pos"] !== "undefined" &&
      typeof req.body["pos"].long !== "undefined" &&
      typeof req.body["pos"].lat !== "undefined") {
    var long = parseFloat(req.body["pos"].long);
    var lat = parseFloat(req.body["pos"].lat);
    if (long >= -180 && long <= 180 &&
        lat >= -90 && lat <= 90)
    game["pos"] = {
      long: long,
      lat: lat
    };
  }
  
  // sauvegarde
  DB.games.push(game);

  // sending back saved data to the client
  var body = JSON.stringify(game);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
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