var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js");

app.get('/v1/players/', function(req, res){
  var players, club = req.query.club
  if (club) {
    players = DB.players.filter(function (p) {
      return p.club.id === club;
    });
  } else {
    players = DB.players;
  }
  // do not display password / token
  players = players.map(function (player) {
    return {
      id: player.id,
      nickname: player.nickname,
      name: player.name,
      rank: player.rank,
      club: player.club,
      games: player.games
    }
  });
  //
  var body = JSON.stringify(players);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});
  
app.get('/v1/players/autocomplete/', function(req, res){
  var players, query = req.query.q
  if (query) {
    players = DB.players.filter(function (p) {
      return p.name.removeDiacritics().toLowerCase().indexOf(query) !== -1 ||
             p.nickname.removeDiacritics().toLowerCase().indexOf(query) !== -1;
    });
  } else {
    players = [];
  }
  // do not display password / token
  players = players.map(function (player) {
    return {
      id: player.id,
      nickname: player.nickname,
      name: player.name,
      rank: player.rank,
      club: player.club,
      games: player.games
    }
  });
  //
  var body = JSON.stringify(players);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});
  

// POST /v1/players/
app.post('/v1/players/', express.bodyParser(), function(req, res){
  // creating a new player
  var player = {
      id: DB.generateFakeId(),
      nickname: null,
      name: null,
      rank: null,
      club: null,
      games: [],
      password: null,
      token:  String(Math.floor(Math.random()*10000000)),
  };
  //
  ["nickname", "name", "rank", "password"].forEach(function (o) {
    if (typeof req.body[o] !== "undefined")
      player[o] = req.body[o];
  });
  // cas particulier club
  if (req.body["club"] &&
      typeof req.body["club"] === "object" &&
      typeof req.body["club"].id !== "undefined" &&
      typeof req.body["club"].name !== "undefined") {
    player.club = req.body["club"];
  }
  //
  DB.players.push(player);
  // sending back saved data to the client
  var body = JSON.stringify(player);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

// POST /v1/players/:id/?playerid=...&token=...
app.post('/v1/players/:id', express.bodyParser(), function(req, res){
  if (!DB.isAuthenticated(req.query)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "unauthorized"}));
    return; // FIXME: error
  }
  var player = DB.searchById(DB.players, req.params.id);
  if (!player) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "player doesn't exist"}));
    return; // FIXME: error
  }
  if (req.params.id !== req.body.id) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "wrong format"}));
    return; // FIXME: error
  }
  if (player.token !== req.body.token) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({"error": "unauthorized"}));
    return; // FIXME: error
  }
  // updating player
  ["nickname", "name", "rank", "club", "password"].forEach(function (o) {
    if (typeof req.body[o] !== "undefined")
      player[o] = req.body[o];
  });
  // sending back saved data to the client
  var body = JSON.stringify(player);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

// searching a specific player
app.get('/v1/players/:id', function(req, res){
  var player = DB.searchById(DB.players, req.params.id);
  if (player) {
    // removing token from player. (private data)
    var p = { };
    for (var i in player) {
      p[i] = player[i];
    }
    p["token"] = null;
    p["password"] = null;
    player = p;
  }
  var body = JSON.stringify(player);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});
