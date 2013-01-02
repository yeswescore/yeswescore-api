var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js");

/*
  * SEARCHING GAMES :
  * 
  * json format:
  * {
  *   id: string,
  *    date_creation: string,
  *    date_start: string
  *    date_end: string
  *    pos: { long: float, lat: float },
  *    country: string,
  *    city: string,
  *    sport: string,
  *    type: string,
  *    sets: string,
  *    score: string,
  *    status: string,
  *    teams: [
  *      {
  *        id: null,
  *        players: [
  *          {
  *            id: string,
  *            nickname: string,
  *            name: string,
  *            rank: string,
  *            club: {
  *              id: string,
  *              name: string
  *            }
  *          }
  *        ]
  *      },
  *      {
  *        id: null,
  *        players: [
  *          {
  *            id: string,
  *            nickname: string,
  *            name: string,
  *            rank: string,
  *            club: {
  *              id: string,
  *              name: string
  *            }
  *          }
  *        ]
  *      },
  *    ]
  * }
  */
app.get('/v1/games/', function(req, res){
  console.log("query="+req.query.q);
  var games, query = req.query.q;

  // params de recherche ?
  if (query) {
    // query inside games
    games = DB.games.filter(function (g) {
      // FIXME: trim, removeDiacritics, security
      return g.city.removeDiacritics().toLowerCase().indexOf(query) !== -1;
    });
    console.log(games.length + " games matchent");
    // query inside players (couteux!)
    var players = DB.players.filter(function (p) {
      return p.nickname.removeDiacritics().toLowerCase().indexOf(query) !== -1 ||
            p.name.removeDiacritics().toLowerCase().indexOf(query) !== -1;
    });
    console.log(players.length + " players matchent");
    players.forEach(function (player) {
      player.games.forEach(function (gameId) {
        // unique, couteux.
        if (!DB.searchById(games, gameId))
          games.push(DB.searchById(DB.games, gameId));
      });
    });
  } else {
    games = DB.games;
  }
  console.log(games.length + ' games');
  
  // formating DB data.
  games = games.map(function (game) {
    return {
      id: game.id,
      date_creation: game.date_creation,
      date_start: game.date_start,
      date_end: game.date_end,
      pos: game.pos,
      country: game.country,
      city: game.city,
      type: game.type,
      sets: game.sets,
      score: game.score,
      sport: game.sport,
      status: game.status,
      owner: game.owner,
      stream: [], // empty
      teams: game.teams.map(function (teamInfo) {
        //
        var players = teamInfo.players.map(function (playerInfo) {
          if (typeof playerInfo.id !== "undefined") {
            var player = DB.searchById(DB.players, playerInfo.id);
            return {
                id: player.id,
                nickname: player.nickname,
                name: player.name,
                rank: player.rank,
                club: player.club
              };
          }
          return playerInfo;
        });
        //
        return { 
          id: null,
          players: players
        };
      })
    }
  });
  // 
  var body = JSON.stringify(games);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

// searching a specific game
app.get('/v1/games/:id', function(req, res){
  var game = DB.searchById(DB.games, req.params.id);
  var result = {};
  if (game) {
    result = {
      id: game.id,
      date_creation: game.date_creation,
      date_start: game.date_start,
      date_end: game.date_end,
      pos: game.pos,
      country: game.country,
      city: game.city,
      type: game.type,
      sets: game.sets,
      score: game.score,
      sport: game.sport,
      status: game.status,
      owner: game.owner,
      teams: game.teams.map(function (teamInfo) {
        //
        var players = teamInfo.players.map(function (playerInfo) {
          if (typeof playerInfo.id !== "undefined") {
            var player = DB.searchById(DB.players, playerInfo.id);
            return {
                id: player.id,
                nickname: player.nickname,
                name: player.name,
                rank: player.rank,
                club: player.club
              };
          }
          return playerInfo;
        });
        //
        return { 
          id: null,
          players: players
        };
      }),
      stream: game.stream
    };
  };
  
  var body = JSON.stringify(result);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
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
          return { id:null, players: [ { id: teamInfo.players[0].id } ] };
        if (typeof teamInfo.players !== "undefined" &&
            Array.isArray(teamInfo.players) &&
            typeof teamInfo.players[0] !== "undefined" &&
            typeof teamInfo.players[0].name !== "undefined")
          return { id:null, players: [ { name: teamInfo.players[0].name } ] };
        return { id:null, players: [ { name: "" } ] };
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