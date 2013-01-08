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
    // slow
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

app.post('/v1/players/', express.bodyParser(), function(req, res){
  // creating a new player
  var player = new DB.Model.Player({
      nickname: req.body.nickname || "",
      name: req.body.name || "",
      rank: req.body.rank || "",
      club: req.body.club || null
  });
  DB.saveAsynch(player)
    .then(
      function (player) { res.end(JSON.stringifyModels(player)) },
      app.defaultError(res)
    );
});

// POST /v1/players/:id/?playerid=...&token=...
app.post('/v1/players/:id', express.bodyParser(), function(req, res){
  if (req.params.id !== req.body.id ||
      req.params.id !== req.query.id) {
    return app.defaultError(res)("id differs");
  }
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      if (!authentifiedPlayer)
        return app.defaultError(res)("player not authenticated");
      // FIXME: use http://mongoosejs.com/docs/api.html#model_Model-findByIdAndUpdate
      DB.Model.Player.findOne({_id:req.params.id})
                     .exec(function (err, player) {
         if (err)
           return app.defaultError(res)(err);
         if (player === null)
           return app.defaultError(res)("no player found");
        // updating player
        ["nickname", "name", "rank", "password", "club"].forEach(function (o) {
          if (typeof req.body[o] !== "undefined")
            player[o] = req.body[o];
        });
        // saving player
        DB.saveAsynch(player)
          .then(function (player) {
            res.end(JSON.stringifyModels(player));
          },
        app.defaultError(res, "update error"));
      });
    },
    app.defaultError(res, "authentication error"));
});

// searching a specific player
app.get('/v1/players/:id', function(req, res){
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      var query = DB.Model.Player.findOne({_id:req.params.id});
      if (req.query.populate === "club")
        query.populate("club", "id name");
      query.exec(function (err, player) {
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
