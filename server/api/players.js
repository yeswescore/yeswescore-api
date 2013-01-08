var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js");

app.get('/v1/players/', function(req, res){
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  var club = req.query.club;

  var query = DB.Model.Player.find({});
  if (club)
    query = query.where("club", club);
  query.skip(offset)
       .limit(limit)
       .exec(function (err, players) {
    if (err)
      return app.defaultError(res)(err);
    res.end(JSON.stringifyModels(players));
  });
});
  
app.get('/v1/players/autocomplete/', function(req, res){
  var limit = req.query.limit || 5;
  var text = req.query.q;
  if (text) {
    text = new RegExp("("+text.searchable().pregQuote()+")");
    
    DB.Model.Player
      .find({})
      .or([{nicknameSearchable: text}, {nameSearchable: text}])
      .sort('name')
      .limit(limit)
      .exec(function (err, players) {
        if (err)
          return app.defaultError(res)(err);
        res.end(JSON.stringifyModels(players));
      });
  } else {
    res.end(JSON.stringify([]));
  }
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
  // sending back saved data to the client
  var body = JSON.stringify(player);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

// searching a specific player
app.get('/v1/players/:id', function(req, res){
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      DB.Model.Player.findOne({_id:req.params.id})
                      .exec(function (err, player) {
        if (err)
          return app.defaultError(res)(err);
        if (player === null)
          return app.defaultError(res)("no player found");
        if (authentifiedPlayer)
          res.end(JSON.stringifyModels(player, { unhide: [ "token", "password"] }));
        else
          res.end(JSON.stringifyModels(player));
      });
    },
    app.defaultError(res, "authentication error"));
});
