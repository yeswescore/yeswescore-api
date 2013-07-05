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
 *  /v2/games/?limit=30              (default=30)
 *  /v2/games/?offset=0              (default=0)
 *  /v2/games/?fields=name           (default=please check in the code)
 *  /v2/games/?sort=-dates.start     (default=-dates.start)
 *  /v2/games/?longitude=40.234      (default=undefined)
 *  /v2/games/?latitude=40.456       (default=undefined)
 *  /v2/games/?distance=20           (default=undefined)
 *
 * Specific options:
 *  /v2/games/?q=text                (Mandatory)
 *  /v2/games/?club=:id
 *  /v2/games/?populate=teams.players (default=teams.players)
 *  /v2/games/?status=finished        (default=created,ongoing,finished)
 * 
 * only query games with teams
 * auto-populate teams.players
 * 
 * fields filter works with populate : (...)?fields=teams.players.name
 */
app.get('/v2/games/', function(req, res){
  var limit = req.query.limit || 30;
  var offset = req.query.offset || 0;
  var text = req.query.q;
  var club = req.query.club || null;
  var fields = req.query.fields || "sport,status,owner,dates.creation,dates.start,dates.update,dates.end,dates.expected,location.country,location.city,location.pos,teams,teams.players.name,teams.players.club,teams.players.rank,infos.type,infos.subtype,infos.sets,infos.score,infos.court,infos.surface,infos.tour,infos.startTeam,infos.official";
  var sort = req.query.sort || "-dates.start";
  var status = req.query.status || "created,ongoing,finished";
  var longitude = req.query.longitude;
  var latitude = req.query.latitude;
  var distance = req.query.distance;
  
  // populate option
  var populate = "teams.players";
  if (typeof req.query.populate !== "undefined")
    populate = req.query.populate;
  var populatePaths = (typeof populate === "string") ? populate.split(",") : [];
  // process fields
  var fields = app.createPopulateFields(fields, populate);
  // heavy...
  var query = DB.Model.Game.find({_deleted: false}, fields.select);
  if (text) {
    text = new RegExp("("+text.searchable().pregQuote()+")");
    query.or([
      { _searchableCity: text },
      { _searchablePlayersNames: text },
      { _searchablePlayersClubsNames: text }
    ]);
  }
  if (club)
    query.where('_searchablePlayersClubsIds', club);
  if (status)
    query.where('status').in(status.split(","));
  if (longitude && latitude && distance)
    query.where('location.pos').within.centerSphere({ center: [ parseFloat(longitude), parseFloat(latitude) ], radius: parseFloat(distance) / 6378.137 });
  query.where('_deleted', false);
  if (populatePaths.indexOf("teams.players") !== -1) {
    query.populate("teams.players", fields["teams.players"]);
  }
  query.sort(sort.replace(/,/g, " "))
       .skip(offset)
       .limit(limit)
       .exec(function (err, games) {
      if (err)
        return app.defaultError(res)(err);
      res.send(JSON.stringifyModels(games));
    });
});

/**
 * Read a game
 * a bit complex due to "populate" option.
 * 
 * Generic options:
 *  /v2/games/:id/?fields=name         (default: please check in the code)
 *
 * Specific options:
 *  /v2/games/:id/?populate=teams.players
 */
app.get('/v2/games/:id', function (req, res){
  var fields = req.query.fields || "sport,status,owner,dates.creation,dates.start,dates.end,dates.expected,location.country,location.city,location.pos,teams,teams.players.name,teams.players.club,teams.players.rank,teams.players.owner,infos.type,infos.subtype,infos.sets,infos.score,infos.court,infos.surface,infos.tour,infos.startTeam,infos.official";
  // populate option
  var populate = "teams.players";
  if (typeof req.query.populate !== "undefined")
    populate = req.query.populate;
  var populatePaths = (typeof populate === "string") ? populate.split(",") : [];
  // preprocess fields
  var fields = app.createPopulateFields(fields, populate);
  // searching player by id.
  var query = DB.Model.Game.findOne({_id:req.params.id, _deleted: false}, fields.select);
  if (populatePaths.indexOf("teams.players") !== -1) {
    query.populate("teams.players", fields["teams.players"]);
  }
  query.exec(function (err, game) {
    if (err)
      return app.defaultError(res)(err);
    if (game === null)
      return app.defaultError(res)("no game found");
    // should we hide the owner ?
    res.send(JSON.stringifyModels(game));
  });
});

/**
 * Read a game stream
 *   sorting item by date_creation.
 * 
 * Generic options:
 *  /v2/games/:id/stream/?limit=5       (default=10)
 *
 * Specific options:
 *  /v2/games/:id/stream/?after=date    ex: "16:01:2013" ou "16 janvier 2013" ou...
 *  /v2/games/:id/stream/?lastid=...    recherche ts les elements depuis tel ou tel id
 * 
 * WARNING: might be performance hits. We can't use $elemMatch (see below).
 * FIXME: solution: create a separate collection for the stream.
 */
app.get('/v2/games/:id/stream/', function (req, res){
  var limit = req.query.limit || 10;
  var after = req.query.after || null;
  var lastid = req.query.lastid || null;
  
  var query = DB.Model.Game.findOne({_id:req.params.id, _deleted: false})
  query.exec(function (err, game) {
    if (err)
      return app.defaultError(res)(err);
    if (game === null)
      return app.defaultError(res)("no game found");
    
    // we select the stream & filter using javascript.
    // this cannot be done at the driver level using something like
    // > query.select({ stream: { $elemMatchAll: { 'dates.creation' : { $gte: new Date(after) } } } });
    // because $elemMatchAll doesn't exist & $elemMatch only return 1 result.
    // @øee http://docs.mongodb.org/manual/reference/projection/elemMatch/#_S_elemMatch
    // @see https://jira.mongodb.org/browse/SERVER-6612
    
    var stream = game.stream || [];
    // filtering
    stream = stream.filter(function (s) {
      return s._deleted === false;
    });
    
    // after
    if (after) {
      after = new Date(after).getTime();
      stream = stream.filter(function (streamItem) {
        return new Date(streamItem.dates.creation).getTime() >= after;
      });
    }
    
    // lastid
    if (lastid) {
      stream = stream.filter(function (streamItem) {
        return streamItem.id > lastid;
      });
    }
    
    // sorting by date (new to old)
    stream.sort(function (a, b) {
      if (a.dates.creation < b.dates.creation)
        return 1;
      if (a.dates.creation > b.dates.creation)
        return -1;
      return 0;
    });
    
    // limit
    stream = stream.filter(function (streamItem, index) {
      return index < limit;
    });
    
    // populating owners
    // FIXME: should be optimized.
    var playersPromises = stream.map(function (streamItem) {
      if (streamItem.owner.player)
        return Q.nfcall(DB.Model.Player.findById.bind(DB.Model.Player),
                        streamItem.owner.player);
      return Q.resolve(null); // facebook
    });
    
    Q.all(playersPromises).then(
      function (players) {
        // remplacing :
        //     { owner: { player: "512fd6227293e00f60000026" } } 
        //  or { owner: { facebook: { id: "7293e00f6", name: "..." } } }
        //
        // to:
        //
        //     { owner: { player: { id: "...", name: "..." } } }
        //  or { owner: { facebook: { id: "7293e00f6", name: "..." } } }
        stream = stream.map(function (streamItem, index) {
          // FIXME: mongoose missing feature.
          // How to populate a model property manually after instantiation?
          // https://groups.google.com/forum/?fromgroups=#!topic/mongoose-orm/nrBq_gOVzBo
          var streamItemObject = streamItem.toObject({virtuals: true, transform: true});
          var player = players[index];
          if (player) {
            var playerId = streamItemObject.owner.player;
            streamItemObject.owner.player = {
              id: playerId,
              name: player.name
            };
          }
          return streamItemObject;
        });
        
        // FIXME: should be stringifyModels when mongoose will be fixed.
        res.send(JSON.stringify(stream));
    });
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
 *   sport: String        (default="tennis")
 *   status: String,      (default="created")
 *   location : {
 *     country: String,         (default="")
 *     city: String,            (default="")
 *     pos: [ Number, Number ]  (default=[])
 *   },
 *   dates: {
 *     expected: Date    (default=undefined)  
 *   }
 *   teams: [
 *     {
 *       points: String,            (default="")
 *       players: [
 *         ObjectId,                (default=not exist) teams.players can be id
 *         { name: "owned player" } (default=not exist) or objects
 *       ]
 *     }
 *   ],
 *   infos: {
 *      subtype: String   (default="A")
 *      sets: String,     (default="")
 *      score: String,    (default="")
 *      court: String,    (default="")
 *      surface: String   (default="")
 *      tour: String      (default="")
 *      startTeam: Int    (default=undefined) must be undefined, 0 or 1.
 *		official: Boolean  (default=true)
 *   }
 * }
 * 
 * result is a redirect to /v2/games/:newid
 */
app.post('/v2/games/', express.bodyParser(), function (req, res) {
  var err = DB.Model.Game.checkFields(req.body);
  if (err)
    return app.defaultError(res)(err);
  DB.isAuthenticatedAsync(req.query)
    .then(function checkPlayersExists(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      // players id exist
      // owned player are created
      // => creating game
      req.body.location = (req.body.location) ? req.body.location : {};
      req.body.infos = (req.body.infos) ? req.body.infos : {};
      var game = new DB.Model.Game({
        sport: req.body.sport || "tennis",
        owner: authentifiedPlayer.id,
        status: req.body.status || "created",
        location : {
          country: req.body.location.country || "",
          city: req.body.location.city || "",
          pos: req.body.location.pos || []
        },
        teams: [ // game has 2 teams (default)
          { points: "", players: [] },
          { points: "", players: [] }
        ],
        stream: [],
        infos: {
          type: "singles",
          subtype: req.body.infos.subtype || "A",
          sets: req.body.infos.sets || "",
          score: req.body.infos.score || "",
          court: req.body.infos.court || "",
          surface: req.body.infos.surface || "",
          tour: req.body.infos.tour || ""          
        }
      });
      
	  //console.log('games.js :typeof req.body.infos.official',typeof req.body.infos.official);
	  //console.log('games.js :req.body.infos.official',req.body.infos.official);
	  
      if (typeof req.body.infos.official === "boolean")
        game.infos.official = req.body.infos.official;
	  else if (typeof req.body.infos.official === "string" && req.body.infos.official === "false")	
	    game.infos.official = false;
	  else 
	    game.infos.official = true;
        
      //if (req.body.dates) {
      // console.log(JSON.stringify(req.body)); 
      //}  
	  console.log('games.js :game.infos.official',game.infos.official);
      
      
  	  if (req.body.dates && typeof req.body.dates.expected === "string")
        game.dates.expected = req.body.dates.expected;
      
      
      return DB.Model.Game.updateTeamsAsync(game, req.body.teams);
    }).then(function saveAsync(game) {
      return DB.saveAsync(game);
    }).then(function saveStartTeam(game) {
      if (req.body.infos.startTeam) {
        var startTeam = parseInt(req.body.infos.startTeam, 10);
        if (startTeam === 0 || startTeam === 1) {
          game.infos.startTeam = game.teams[startTeam].id;
          return DB.saveAsync(game);
        }
      }
      return game;
    }).then(function sendGame(game) {
      app.internalRedirect('/v2/games/:id')(
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
 *   status: String,      (default="")
 *   location: {
 *     country: String,        (default="")
 *     city: String,           (default="")
 *     pos: [ Number, Number]  (default=[])
 *   }

 *   sets: String,        (default="")
 *   score: String,       (default="")
 *   court: String,       (default="")
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
 * result is a redirect to /v2/games/:newid
 */
app.post('/v2/games/:id', express.bodyParser(), function(req, res){
  var err = DB.Model.Game.checkFields(req.body);
  if (err)
    return app.defaultError(res)(err);
  // check player is authenticated
  DB.isAuthenticatedAsync(req.query)
    .then(function searchGame(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      return Q.nfcall(DB.Model.Game.findOne.bind(DB.Model.Game),
                      {_id:req.params.id, _deleted: false});
    }).then(function checkGameOwner(game) {
      if (game === null)
        throw "no game found";
      if (game.owner != req.query.playerid) // /!\ cant do '!==' on objectId
        throw "you are not the owner of the game";
      return game;
    }).then(function updateFields(game) {
      // updatable simple fields
      if (typeof req.body.status !== "undefined")
        game.status = req.body.status;
      if (typeof req.body.location !== "undefined") {
        if (typeof req.body.location.country === "string")
          game.location.country = req.body.location.country;
        if (typeof req.body.location.city === "string")
          game.location.city = req.body.location.city;
      } 
      if (typeof req.body.infos !== "undefined") {
        if (typeof req.body.infos.type === "string")
          game.infos.type = req.body.infos.type;
        if (typeof req.body.infos.subtype === "string")
          game.infos.subtype = req.body.infos.subtype;
        if (typeof req.body.infos.sets === "string")
          game.infos.sets = req.body.infos.sets;
        if (typeof req.body.infos.score === "string")
          game.infos.score = req.body.infos.score;
        if (typeof req.body.infos.court === "string")
          game.infos.court = req.body.infos.court;
        if (typeof req.body.infos.surface === "string")
          game.infos.surface = req.body.infos.surface;
        if (typeof req.body.infos.tour === "string")
          game.infos.tour = req.body.infos.tour;
		  
	    console.log('games.js :typeof req.body.infos.official',typeof req.body.infos.official);  
		console.log('games.js :req.body.infos.official',req.body.infos.official);  		
		
        if (typeof req.body.infos.official === "boolean")
          game.infos.official = req.body.infos.official;                
      }
      game.dates.update = Date.now();
      
  	  if (req.body.dates && typeof req.body.dates.expected === "string") {
        game.dates.expected = req.body.dates.expected;   
        console.log('req.body.dates.expected ' + req.body.dates.expected);
      }
      
      //
      return DB.Model.Game.updateTeamsAsync(game, req.body.teams);
    }).then(function update(game) {
      return DB.saveAsync(game);
    }).then(function saveStartTeam(game) {
      if (typeof req.body.infos !== "undefined" && 
          req.body.infos.startTeam) {
        var startTeam = parseInt(req.body.infos.startTeam, 10);
        if (startTeam === 0 || startTeam === 1) {
          game.infos.startTeam = game.teams[startTeam].id;
          return DB.saveAsync(game);
        }
        if (req.body.infos.startTeam == game.teams[0].id ||
            req.body.infos.startTeam == game.teams[1].id) {
          game.infos.startTeam = req.body.infos.startTeam;
          return DB.saveAsync(game);
        }
      }
      return game;
    }).then(function sendGame(game) {
      app.internalRedirect('/v2/games/:id')(
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
 *   type: "comment",   (default="comment")
 *   owner: { player: ObjectId, facebook: { id: "...", name: "..." } }
 *   data: { text: "..." }
 * }
 */
app.post('/v2/games/:id/stream/', express.bodyParser(), function(req, res){
  // input validation
  if (req.body.type !== "comment")
    return app.defaultError(res)("type must be comment");
  if (req.query.fbid) {
    if (!req.body.owner || !req.body.owner.facebook)
      return app.defaultError(res)("missing owner.facebook");
    if (typeof req.body.owner.facebook.id !== "string" ||
        typeof req.body.owner.facebook.name !== "string")
      return app.defaultError(res)("missing facebook.id or facebook.name");
    if (req.query.fbid !== req.body.owner.facebook.id)
      return app.defaultError(res)("fbid !== owner.facebook.id");
  }
  //
  DB.isAuthenticatedAsync(req.query, { facebook: true })
    .then(function searchGame(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      return Q.nfcall(DB.Model.Game.findOne.bind(DB.Model.Game),
                      {_id:req.params.id, _deleted: false});
    }).then(function pushIntoStream(game) {
      if (game === null)
        throw "no game found";
      // FIXME: performance issue here...
      //  we should be using { $push: { stream: streamItem } }
      //  but there are 2 problems :
      //   - how can we get the new _id with $push api ? (need to read using slice -1 ? might be race conditions :(
      //   - seems to be a bug: no _id is created in mongo :(
      var streamItem = {};
      streamItem.type = "comment";
      if (req.query.playerid) {
        streamItem.owner = { player: req.query.playerid };
      } else {
        streamItem.owner = {
          facebook: {
            id: req.body.owner.facebook.id,
            name: req.body.owner.facebook.name
          }
        };
      }
      // adding text
      if (req.body.data && req.body.data.text)
        streamItem.data = { text: req.body.data.text };
      game.stream.push(streamItem);
      game.dates.update = Date.now();
      return DB.saveAsync(game);
    }).then(function sendGame(game) {
      if (game.stream.length === 0)
        throw "no streamItem added";
      res.send(JSON.stringifyModels(game.stream[game.stream.length - 1]));
    }, app.defaultError(res));
});

/*
 * Update a streamitem
 *
 * You must be authentified
 * 
 * Body {
 *   data: { text: "..." }
 * }
 * 
 * This code is not performant.
 */
app.post('/v2/games/:id/stream/:streamid/', express.bodyParser(), function(req, res){
  DB.isAuthenticatedAsync(req.query, { facebook: true })
    .then(function searchGame(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      return Q.nfcall(DB.Model.Game.findOne.bind(DB.Model.Game),
                      {_id:req.params.id, _deleted: false});
    }).then(function checkGameOwner(game) {
      if (game === null)
        throw "no game found";
      return game;
    }).then(function (game) {
      // search the streamItem
      if (!Array.isArray(game.stream))
        throw "empty stream";
      var streamid = req.params.streamid
        , l = game.stream.length;
      for (var i = 0; i < l; ++i) {
        if (game.stream[i]._id == streamid) {
          // streamItem found => update it
          if (req.body.data && req.body.data.text)
            game.stream[i].data = { text: req.body.data.text };
          game.stream[i].dates.update = Date.now();
          return DB.saveAsync(game);
        }
      }
      throw "no streamItem found";
    }).then(function (game) {
      var streamid = req.params.streamid
        , l = game.stream.length;
      for (var i = 0; i < l; ++i) {
        if (game.stream[i]._id == streamid) {
          var streamItem = game.stream[i].toObject({virtuals: true, transform: true});
          res.send(JSON.stringify(streamItem));
        }
      }
      // we normaly shouldn't reach this point.
      throw "unknown exception";
    }, app.defaultError(res));
});

/*
 * Delete a game
 *
 * You must be authentified
 * 
 * /v2/games/:id/?_method=delete
 * 
 * FIXME: remove from player games.
 */
app.delete('/v2/games/:id/', function (req, res) {
  DB.isAuthenticatedAsync(req.query)
    .then(function searchGame(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      return Q.nfcall(DB.Model.Game.findOne.bind(DB.Model.Game),
                      {_id:req.params.id, _deleted: false});
    }).then(function checkGameOwner(game) {
      if (game === null)
        throw "no game found";
      if (game.owner != req.query.playerid) // /!\ cant do '!==' on objectId
        throw "you are not the owner of the game";
      return game;
    }).then(function (game) {
      // mark the game as deleted
      game._deleted = true;
      return DB.saveAsync(game);
    }).then(function () {
      res.send('{}'); // smallest json.
    }, app.defaultError(res));
});

/*
 * Delete a streamItem
 *
 * You must be authentified
 * 
 * /v2/games/:id/?_method=delete
 * 
 * FIXME: remove from player games.
 */
app.delete('/v2/games/:id/stream/:streamid/', function (req, res) {
  DB.isAuthenticatedAsync(req.query)
    .then(function searchGame(authentifiedPlayer) {
      if (authentifiedPlayer === null)
        throw "unauthorized";
      return Q.nfcall(DB.Model.Game.findOne.bind(DB.Model.Game),
                      {_id:req.params.id, _deleted: false});
    }).then(function checkGameOwner(game) {
      if (game === null)
        throw "no game found";
      return game;
    }).then(function (game) {
      // search the streamItem
      if (!Array.isArray(game.stream))
        throw "empty stream";
      var streamid = req.params.streamid
        , l = game.stream.length;
      for (var i = 0; i < l; ++i) {
        if (game.stream[i]._id == streamid) {
          // streamItem found => delete it
          game.stream[i]._deleted = true;
          game.stream[i].dates.update = Date.now();
          return DB.saveAsync(game);
        }
      }
      throw "no streamItem found";
    }).then(function () {
      res.send('{}'); // smallest json.
    }, app.defaultError(res));
});

