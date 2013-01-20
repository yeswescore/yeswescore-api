var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Q = require("q");

/**
 * Read All Players
 * 
 * Generic options:
 *  /v1/players/?limit=0
 *  /v1/players/?offset=0
 *  /v1/players/?fields=nickname,name
 *
 * Specific options:
 *  /v1/players/?club=:id   (filter with a club)
 */
app.get('/v1/players/', function(req, res){
  var limit = req.query.limit || 10;
  var offset = req.query.offset || 0;
  var club = req.query.club;
  var fields = req.query.fields;

  var query = DB.Model.Player.find({type:"default"});
  if (fields)
    query.select(fields.replace(/,/g, " "))
  if (club)
    query.where("club.id", club);
  query.skip(offset)
       .limit(limit)
       .exec(function (err, players) {
    if (err)
      return app.defaultError(res)(err);
    res.end(JSON.stringifyModels(players));
  });
});

/**
 * Autocomplete search in players
 * 
 * Generic options:
 *  /v1/players/autocomplete/?limit=5     (default=5)
 *  /v1/players/autocomplete/?fields=nickname,name  (default=nickname,name,type)
 *  /v1/players/autocomplete/?sort=nickname (default=name)
 *
 * Specific options:
 *  /v1/players/autocomplete/?q=Charlotte (searched text)
 *  /v1/players/autocomplete/?owner=:id   (autocomplete centered to an owner)
 */
app.get('/v1/players/autocomplete/', function(req, res){
  var fields = req.query.fields || "nickname,name,type";
  var limit = req.query.limit || 5;
  var owner = req.query.owner;
  var sort = req.query.sort || "name";
  var text = req.query.q;
  
  if (text) {
    // slow
    text = new RegExp("("+text.searchable().pregQuote()+")");
    // searching
    DB.Model.Player
      .find({
        $and: [
          { $or: [ {_searchableNickname: text}, {_searchableName: text} ] },
          { $or: [ {type: "default"}, {type: "owned", owner: owner} ] }
        ]
      })
      .select(fields.replace(/,/g, " "))
      .sort(sort.replace(/,/g, " "))
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

/**
 * Read a player
 * 
 * Authentication provide password & token
 * 
 * Generic options:
 *  /v1/players/:id/?fields=nickname,name
 *
 * Specific options:
 */
app.get('/v1/players/:id', function(req, res){
  var fields = req.query.fields;
  
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      var query = DB.Model.Player.findById(req.params.id);
      if (fields)
         query.select(fields.replace(/,/g, " "))
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

/**
 * Create a new player
 * 
 * No authentication
 * 
 * Body {
 *   nickname: String, (default="")
 *   name: String,     (default="")
 *   rank: String,     (default="")
 *   club: { id:..., name:... }  (default=null, name: is ignored)
 *   type: String      (enum=default,owned default=default)
 * }
 */
app.post('/v1/players/', express.bodyParser(), function(req, res){
  if (req.body.type &&
      DB.Definition.Player.type.enum.indexOf(req.body.type) === -1)
    return app.defaultError(res)("unknown type");
  // club ? => reading club to get the name
  var deferred = Q.defer();
  var club = req.body.club;
  if (club && club.id) {
    DB.Model.Club.findById(club.id, function (err, club) {
      if (err)
        return deferred.reject(err);
      deferred.resolve(club);
    });
  } else {
    deferred.resolve(null);
  }
  deferred.promise.then(function (club) {
    // creating a new player
    var inlinedClub = (club) ? { id: club.id, name: club.name } : null;
    var player = new DB.Model.Player({
        nickname: req.body.nickname || "",
        name: req.body.name || "",
        rank: req.body.rank || "",
        club: inlinedClub, // will be undefined !
        type: req.body.type || "default"
    });
    return DB.saveAsync(player);
  }).then(function (player) {
    res.end(JSON.stringifyModels(player, { unhide: [ "token", "password"] }));
  }, app.defaultError(res));
});

/**
 * update a player
 * 
 * You must be authentified (?playerid=...&token=...)
 * 
 * Body {
 *   nickname: String, (default=undefined)
 *   name: String,     (default=undefined)
 *   rank: String,     (default=undefined)
 *   club: { id:..., name:... }  (default=undefined, name: is ignored)
 *   password: String  (default=undefined)
 * }
 */
app.post('/v1/players/:id', express.bodyParser(), function(req, res){
  if (req.params.id !== req.body.id ||
      req.params.id !== req.query.playerid) {
    return app.defaultError(res)("id differs");
  }
  var deferred = Q.defer();
  var club = req.body.club;
  if (club && club.id) {
    DB.Model.Club.findById(club.id, function (err, club) {
      if (err)
        return deferred.reject(err);
      deferred.resolve(club);
    });
  } else {
    deferred.resolve(null);
  }
  deferred.promise.then(function (club) {
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
          var inlinedClub = (club) ? { id: club.id, name: club.name } : null;
          if (inlinedClub) {
            player["club"] = inlinedClub;
          }
          ["nickname", "name", "rank", "password"].forEach(function (o) {
            if (typeof req.body[o] !== "undefined")
              player[o] = req.body[o];
          });
          // saving player
          DB.saveAsync(player)
            .then(function (player) {
              res.end(JSON.stringifyModels(player, { unhide: [ "token", "password"] }));
            },
          app.defaultError(res, "update error"));
        });
      },
      app.defaultError(res, "authentication error"));
  }, app.defaultError(res));
});
