var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Conf = require('./conf.js')
  , Q = require('q')
  , app = require('./app.js')
  , crypto = require('crypto');
  
var ObjectId = mongoose.Types.ObjectId;

var DB = {
  status : 'disconnected',
  
  // mongoose data.
  Definition: { },  // schema definitions
  Schema: { },      // mongoose schemas
  Model: { },       // mongoose models
  
  /*
   * Saving one or many mongo documents.
   * 
   * ex: 
   *   var player = new DB.Model.Player({ "name" : "vincent" });
   *   DB.saveAsync(player).then(
   *     function success() { console.log('saved') },
   *     function error() { console.log('error') }
   *   );
   * 
   * ex:
   *   var playerA = new DB.Model.Player({ "name" : "vincent" });
   *   var playerB = new DB.Model.Player({ "name" : "marc" });
   *   DB.saveAsync([playerA, playerB])
   *     .then(
   *     function success(players) {
   *        console.log(players.length + ' models saved')
   *     },
   *     function error() { console.log('error') }
   *   );
   */
  saveAsync: function (doc) {
    if (Array.isArray(doc)) {
      var promises = doc.map(function _save(doc) {
        var simpleDeferred = Q.defer();
        // saving
        doc.save(function (err) {
          if (err) {
            simpleDeferred.reject(err);
          } else {
            simpleDeferred.resolve(doc);
          }
        });
        return simpleDeferred.promise;
      });
      //
      return Q.all(promises);
    } else {
      var simpleDeferred = Q.defer();
      doc.save(function (err) {
        if (err) {
          simpleDeferred.reject(err);
        } else {
          simpleDeferred.resolve(doc);
        }
      });
      return simpleDeferred.promise;
    }
  },
  
  existAsync: function (model, ids) {
    var deferred = Q.defer();
    if (typeof ids === "string") {
      ids = [ ids ];
    }
    model.count({ _id: { $in: ids }})
         .exec(function (err, count) {
           if (err)
             return deferred.reject(err);
           if (count !== ids.length)
             return deferred.resolve(false);
           return deferred.resolve(true);
         });
    return deferred.promise;
  },
  
  /**
   * Read a random model from a model collection.
   * ex:
   *   DB.getRandomModelAsync(DB.Model.Player)
   *     .then(function (randomPlayer) {
   *        console.log("got a randomPlayer ! ");
   *     });
   */
  getRandomModelAsync : function (model) {
    var deferred = Q.defer();
    //
    model.count({}, function (err, nb) {
      if (err)
        return deferred.reject(err);
      var randomIndex = Math.floor(Math.random() * nb);
      model.find({}).skip(randomIndex).limit(1).exec(function (err, result) {
        if (err)
          return deferred.reject(err);
        return deferred.resolve(result[0]);
      });
    });
    return deferred.promise;
  },
  
  generateToken : function () {
    return String(Math.floor(Math.random()*10000000));
  }
};

//
// Definitions
//

// ClubID,Name,Ligue,Zip,City,Outdoor,Indoor,Players,Players-1AN,Teams,Teams-1AN,School?
// =>
// fedid,name,ligue,zip,city,outdoor,indoor,countPlayers,countPlayers1AN,countTeams,countTeams1AN,school
DB.Definition.Club = {
  sport: String,
  name: String,
  dates : {
    creation: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now }
  },
  location: {
    city: String,
    pos: {type: [Number], index: '2d'},
    address: String,
    zip: String
  },
  fedid: { type: String, unique: true, sparse: true },
  ligue: String,
  outdoor: Number,
  indoor: Number,
  countPlayers: Number,
  countPlayers1AN: Number,
  countTeams: Number,
  countTeams1AN: Number,
  school: String,
  // private 
  _deleted: { type: Boolean, default: false }, // FIXME: unused
  _reported: { type: Boolean, default: false },
  // private searchable fields
  _searchableName: String  // AUTO-FIELD (Club pre save)
};
DB.Definition.Player = {
  name: String,
  location: {
    currentPos: { type: [Number], index: '2d'},
    city: String,
    address: String,
    zip: String    
  },
  dates : {
    creation: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now },
    birth: { type: Date }
  },
  push: {
    platform: { type: String, enum: [ "android", "ios", "wp8", "bb" ] },
    token: { type: String }
  },
  gender: { type: String, enum: [ "", "man", "woman" ] },
  profile: {
    image: { type: String, ref: "File" }
  },
  email: {
    address: { type: String, unique: true, sparse: true },
    // internal features of the email. 
    // should be refactored withe mailer worker + redis stack.
    status: { type: String, enum: ["pending-confirmation", "confirmed"] },
    _backup: { type: String },
    _token: { type: String },
    _dates: {
      _created: { type: Date },
      _sended: { type: Date },
      _confirmed: { type: Date }
    }
  },
  language: { type: String, enum: [ "en", "fr" ] },
  idlicense: String,
  password: { type: String, default: null },
  token: { type: String, default: DB.generateToken },
  connection: {
    facebook: {
      id: String,
      token: String
    }
  },
  rank: String,
  club: {
    id: { type: Schema.Types.ObjectId, ref: "Club" },
    name: String // AUTO-FIELD (Player pre save)
  },
  games: [ { type: Schema.Types.ObjectId, ref: "Game" } ], // AUTO-FIELD (Game post save)
  following: [ { type: Schema.Types.ObjectId, ref: "Player" } ],
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  type: { type: String, enum: [ "default", "owned" ], default: "default" },
  // private 
  _deleted: { type: Boolean, default: false },  // FIXME: unused
  _reported: { type: Boolean, default: false },
  // private searchable fields
  _searchableName: String,      // AUTO-FIELD (Player pre save)
  _searchableClubName: String   // AUTO-FIELD (Player pre save)
};
DB.Definition.Team = {
  players: [ { type: Schema.Types.ObjectId, ref: "Player" } ],
  points: String,
  // private 
  _deleted: { type: Boolean, default: false },  // FIXME: unused
  _reported: { type: Boolean, default: false }  // FIXME: unused
};
DB.Definition.StreamItem = {
  dates : {
    creation: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now }
  },
  type: { type: String, enum: [ "comment", "image" ] },
  owner: {
    player: { type: Schema.Types.ObjectId, ref: "Player" },
    facebook: { id: String, name: String }
  },
  data: Schema.Types.Mixed,
  // private 
  _deleted: { type: Boolean, default: false },
  _reported: { type: Boolean, default: false }
};
// WE must instantiate Team & Stream Schema FIRST.
DB.Schema.Team = new Schema(DB.Definition.Team);
DB.Schema.StreamItem = new Schema(DB.Definition.StreamItem);
// 
DB.Definition.Game = {
  sport: { type: String, enum: ["tennis"] },
  status: { type: String, enum: [ "created", "ongoing", "finished", "canceled" ], default: "created" },
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  dates : {
    creation: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now },
    start: Date,
    end: Date,
    expected: { type: Date } 
  },
  location : {
    country: String,
    city: String,
    pos: {type: [Number], index: '2d'}
  },
  teams: [ DB.Schema.Team ],
  stream: [ DB.Schema.StreamItem ],
  streamCommentsSize: { type: Number, default: 0 },
  streamImagesSize: { type: Number, default: 0 },
  infos: {
    type: { type: String, enum: [ "singles", "doubles" ] },
    subtype: { type: String, enum: [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ] },
    sets: String,
    score: String,
    court: { type: String, enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
                                  "A", "B", "C", "D", "E", "F", "" ] },
    surface: { type: String, enum: ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ", 
                                    "NVTB", "PAR", "RES", "TB", "" ] },
    tour: String,
    startTeam: { type: Schema.Types.ObjectId },
    official: { type: Boolean, default: true }
  },
  // private 
  _deleted: { type: Boolean, default: false },  // FIXME: unused
  _reported: { type: Boolean, default: false }, // FIXME: unused
  // private searchable fields
  _searchableCity: String,                                // AUTO-FIELD (Game pre save)
  _searchablePlayersNames: [ String ],                    // AUTO-FIELD (Player post save) ASYNC
  _searchablePlayersClubsIds: [ Schema.Types.ObjectId ],  // AUTO-FIELD (Player post save) ASYNC
  _searchablePlayersClubsNames: [ String ]                // AUTO-FIELD (Player post save) ASYNC
};
DB.Definition.File = {
  _id: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  dates : {
    creation: { type: Date, default: Date.now }
  },
  path: { type: String },
  mimeType: { type: String, enum: [ "image/jpeg" ], default: "image/jpeg" },
  bytes: { type: Number, default: 0 },
  metadata: Schema.Types.Mixed, // { usage: "profil/streamitem/...", id: }
  // private
  _deleted: { type: Boolean, default: false },  // FIXME: unused
  _reported: { type: Boolean, default: false }, // FIXME: unused
};

// SETTERS
DB.Definition.Game.status.set = function (status) {
  // handling status.
  var oldStatus = this.status;
  this.dates = this.dates || {};
  if (status === "created" && oldStatus === "ongoing")
    this.dates.start = undefined;
  if (status === "ongoing" && oldStatus === "created")
    this.dates.start = Date.now();
  if (status === "ongoing" && oldStatus === "finished")
    this.dates.end = undefined;
  if ((status === "finished" && oldStatus === "created") ||
      (status === "finished" && oldStatus === "ongoing"))
    this.dates.end = Date.now();
  return status;
};

//
// Schemas
//
DB.Schema.Club = new Schema(DB.Definition.Club);
DB.Schema.Player = new Schema(DB.Definition.Player);
DB.Schema.Game = new Schema(DB.Definition.Game);
DB.Schema.File = new Schema(DB.Definition.File);

// password virtual setter
DB.Schema.Player.virtual('uncryptedPassword').set(function (uncryptedPassword) {
  var shasum = crypto.createHash('sha256');
  // android bug with swipe: we do not want any [space] chars.
  shasum.update(uncryptedPassword.replace(/ /g, '')+Conf.get("security.secret"));
  this.password = shasum.digest('hex');
});

DB.Schema.Player.virtual('languageSafe').set(function (languageUnsafe) {
  // filtering languages to enter enum
  // @see http://tools.ietf.org/html/rfc4646
  // ex: en-US => en
    var language = languageUnsafe.split('-')[0];
    var languages = DB.Schema.Player.path('language').enumValues;
    if (languages.indexOf(language) === -1)
      language = Conf.get("default.language");
    this.language = language;
});


// AUTO-FIELDS
DB.Schema.Club.pre('save', function (next) {
  // club._searchableName
  if (this.isModified('name'))
    this._searchableName = this.name.searchable();
  next();
});

/*
 * Before saving a player we might need to 
 *  - update searchableName
 *  - update searchableClubName
 */
DB.Schema.Player.pre('save', function (next) {
  if (this.isModified("games") && this.games.length !== 0)
    throw "should not save games "+JSON.stringify(this);
  // infos for post save
  this._wasModified = [];
  // player._searchableName
  if (this.isModified('name')) {
    this._wasModified.push('name');
    this._searchableName = this.name.searchable();
  }
  // player._searchableClubName
  // player.club.name
  var self = this;
  if (this.isModified('club')) {
    this._wasModified.push('club');
    if (this.club && typeof this.club.id !== "undefined") { // WTF.. on this test.
      // club has been added / modified
      DB.Model.Club.findById(this.club.id, function (err, club) {
        if (err) {
          app.log('player pre save; error ' + err, 'error');
          return next(); // FIXME: log.
        }
        self.club.name = club.name;
        self._searchableClubName = club.name.searchable();
        next();
      });
    } else {
      next(); // club has been removed. => nothing. 
    }
  } else {
    next();
  }
});

//
// Optim: post('exec', ...) => 
//     save in _dbValue = [ name, ... ]
//  => prevent populate :
//   - find(...).exec(
//       $pull: oldPlayerName
//   )
//

/*
 * After saving a player we might need to 
 *  - update Game searchableName
 *  - update Game searchableClubName
 *  - update Game searchableClubId
 */
DB.Schema.Player.post('save', function () {
  // SUPER HEAVY PLAYER GAMES UPDATE
  // SHOULD BE DISPATCHED TO A WORKER, ASYNC STUFF.
  if (this._wasModified.indexOf("name") === -1 &&
      this._wasModified.indexOf("club") === -1)
    return;

  var wasModified = this._wasModified; // is garbage collected by mongoose ?
  
  // ASYNC STUFF HERE
  // maybe we should use player.games
  DB.Model.Game.find({"teams.players": this.id})
                .select("teams")
                .populate("teams.players")
                .exec(function (err, games) {
    if (err) {
      app.log('player post save error ' + err, 'error');
      return;
    }
    // for
    games.forEach(function postSaveUpdateForEachGame(game) {
      if (wasModified.indexOf("name") !== -1) {
        game._searchablePlayersNames = game.teams.reduce(function (p, team) {
          return p.concat(team.players.map(function (player) {
            return player.name.searchable();
          }));
        }, []);
      }
      //
      if (wasModified.indexOf("club") !== -1) {
        game._searchablePlayersClubsIds = game.teams.reduce(function (p, team) {
          return p.concat(team.players.filter(function (player) {
            return player.club && player.club.id;
          }).map(function (player) {
            return player.club.id;
          }));
        }, []);
        
        game._searchablePlayersClubsNames = game.teams.reduce(function (p, team) {
          return p.concat(team.players.filter(function (player) {
            return player.club && player.club.name;
          }).map(function (player) {
            return player.club.name.searchable();
          }));
        }, []);
      }
      // When ? we don't know & we don't mind *yet* :)
      game.save();
    }, this);
  });
});

/*
 * Before saving a game we might need to 
 *  - update searchableName
 *  - update searchableClubName
 *  - update searchableClubIds
 * 
 * FIXME: performance: need to read teams.players ?
 * 
 */
DB.Schema.Game.pre('save', function (next) {  
  // infos for post save
  this._wasModified = [];
  // game._searchableCity
  if (this.isModified('location.city'))
    this._searchableCity = this.location.city.searchable();
  // game._teams
  if (this.isModified('teams')) {
    this._wasModified.push('teams');
    // we need first to read the players from DB, to get the old "players"
    //  and be able to "remove" potentially added players
    DB.Model.Game.findById(this.id)
                 .select("teams.players")
                 .exec(function (err, oldGame) {
      if (err)
        return next(); // FIXME: we should log this error.
      // reading players from DB.
      this._newPlayersIds = this.teams.reduce(function (p, team) {
        return p.concat(team.players);
      }, []);
      if (oldGame) {
        this._oldPlayersIds = oldGame.teams.reduce(function (p, team) {
          return p.concat(team.players);
        }, []);
      } else {
        this._oldPlayersIds = []; // might be no old game (creation).
      }
      // players should exist in db
      DB.Model.Player.find({_id: { $in: this._newPlayersIds } }, function (err, players) {
        if (err)
          return next(); // FIXME: we should log this error.
        if (!players)
          return next(); // FIXME: we should log this error.
        this._searchablePlayersNames = players.map(function (p) { return p.name.searchable() });
        this._searchablePlayersClubsIds = players.filter(function (p) { return p.club && p.club.id })
                                                .map(function (p) { return p.club.id });
        this._searchablePlayersClubsNames = players.filter(function (p) { return p.club && p.club.name })
                                                  .map(function (p) { return p.club.name.searchable() });
        next();
      }.bind(this));
    }.bind(this));
  } else {
    next();
  }
});

/*
 * After saving a game we might need to 
 *  - update Player games
 * 
 * FIXME: update Player.games sync or async ?
 */
DB.Schema.Game.post('save', function () {
  if (this._wasModified.indexOf('teams') === -1)
    return;
  
  // teams were modified, we need to update players.games
  var removedPlayersFilter =
    this._oldPlayersIds.exclude(this._newPlayersIds)
                       .map(function (oldPlayerId) {
      return { _id: oldPlayerId };
    });
  var addedPlayersFilter =
    this._newPlayersIds.exclude(this._oldPlayersIds)
                       .map(function (newPlayerId) {
      return { _id: newPlayerId };
    });
  // should we do unique ? or should we let do player A vs player A ?
  if (removedPlayersFilter.length) {
    DB.Model.Player.update(
      { $or: removedPlayersFilter }, // search filter
      { $pull: { "games" : this.id } },
      { multi: true },
      function (err) { /* FIXME: nothing yet, but should test&log err */  }
    );
  }
  if (addedPlayersFilter.length) {
    DB.Model.Player.update(
      { $or: addedPlayersFilter }, // search filter
      { $addToSet: { "games" : this.id } },
      { multi: true },
      function (err) { /* FIXME: nothing yet, but should test&log err */  }
    );
  }
});

// Hidden fields
var hiddenFields = ["password", "token"];
var deletePrivatesRec = function (o) {
  Object.keys(o).forEach(function (key) {
    if (key[0] === "_") delete o[key];
    if (typeof o[key] === "object" && o[key])
      deletePrivatesRec(o[key]);
  });
};
for (var schemaName in DB.Schema) {
  (function (schema) {
    // Adding transform default func
    schema.options.toObject = {
      transform : function (doc, ret, options) {
        var hide = hiddenFields;
        if (options.unhide) {
          hide = hide.slice(); // clone
          options.unhide.forEach(function (field) { hide.remove(field) });
        }
        // removing private fields
        //    /!\ performance hit :( !!
        deletePrivatesRec(ret);
        // removing hidden fields
        hide.forEach(function (prop) { delete ret[prop] });
      }
    };
  })(DB.Schema[schemaName]);
}

//
// Models
//
DB.Model.Club = mongoose.model("Club", DB.Schema.Club);
DB.Model.Player = mongoose.model("Player", DB.Schema.Player);
DB.Model.Game = mongoose.model("Game", DB.Schema.Game);
DB.Model.File = mongoose.model("File", DB.Schema.File);

DB.Model.Player.isEmailRegisteredAsync = function (email) {
  return Q.nfcall(
    DB.Model.Player.findOne.bind(DB.Model.Player),
    {
      "email.address": email,
      $or: [
        { "email.status": "confirmed" },
        {
          "email.status": "pending-confirmation",
          "email._dates._created": { $gt: Date.now() - 3600 * 1000 }
        }
      ]
    }
  );
};

DB.Model.Player.createEmailToken = function () {
  var shasum = crypto.createHash('sha256');
  shasum.update(Math.random()+' w00t '+Math.random());
  return shasum.digest('hex');
};

DB.Model.Game.checkFields = function (game) {
  // FIXME: can some tests be done with express ? or mongoose ?
  if (game.sport && game.sport !== "tennis")
    return "wrong sport (tennis only)";
  // check type
  if (game.type && game.type !== "singles")
    return "wrong type (singles only)";
  // check status
  if (game.status &&
      game.status !== "created" && game.status !== "ongoing" &&
      game.status !== "finished" && game.status !== "canceled")
    return "wrong status (created/ongoing/finished/canceled)";
  // check teams
  if (game.teams) {
    if (!Array.isArray(game.teams) || game.teams.length !== 2)
      return "teams format";
    // check teams.players
    var ok = game.teams.every(function (team) {
      return Array.isArray(team.players) &&
            team.players.every(function (player) {
              return typeof player === "string" ||
                     typeof player === "object"; // FIXME: should be more strict ..
            });
    });
    if (!ok)
      return "teams.players format";
  }
  if (game.infos && game.infos.court &&
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
       "A", "B", "C", "D", "E", "F", "" ].indexOf(game.infos.court) === -1)
    return "wrong court (1-11, A-F or empty)";
  if (game.infos && game.infos.subtype &&
      [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ].indexOf(game.infos.subtype) === -1)
    return "wrong subtype (A-F)";
  if (game.infos && game.infos.surface &&
      ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ", 
       "NVTB", "PAR", "RES", "TB", "" ].indexOf(game.infos.surface) === -1)
    return "wrong surface (BP,EP,EPDM,GAS,GAZ,MOQ,NVTB,PAR,RES,TB or empty";
    
  //console.log("game.infos.official",game.infos.official);
  //console.log("typeof game.infos.official",typeof game.infos.official);
    
  if (game.infos && game.infos.official &&
      (typeof game.infos.official !== "boolean" && game.infos.official !== "true" && game.infos.official !== "false") )
    return "wrong official ( true or false only )";       
        
  return null;
}

/**
 * FIXME: documentation
 * @return promise , callback val = game
 */
DB.Model.Game.updateTeamsAsync = function (game, teams) {
  // updatable teams.points
  if (!Array.isArray(teams))
    return Q.resolve(game);
  teams.forEach(function (team, teamIndex) {
    if (typeof team.points === "string")
      game.teams[teamIndex].points = team.points;
  });
  // update teams.players
  return DB.Model.Game.updateTeamsPlayersAsync(game, teams); 
};

/**
 * FIXME: documentation
 * @return promise , callback val = game
 */
DB.Model.Game.updateTeamsPlayersAsync = function (game, teams) {
  if (!Array.isArray(teams))
    return Q.resolve(game); // nothing to do.
  return DB.Model.Game.checkTeamsAsync(teams).then(function () {
    // teams exist => create owned players
    return DB.Model.Game.createOwnedPlayersAsync(teams, game.owner)
  }).then(function () {
    // update game teams players
    teams.forEach(function (team, teamIndex) {
      team.players.forEach(function (player, playerIndex) {
        var playerid = (typeof player === "string") ? player: player.id;
        var oldPlayerId = game.teams[teamIndex].players[playerIndex];
        if (playerid != oldPlayerId)
          game.markModified('teams');
        if (typeof playerid === "string")
          playerid = new ObjectId(playerid);
        game.teams[teamIndex].players[playerIndex] = playerid;
      });
    });
    return game;
  });
};


// additionnals functions
DB.Model.Game.checkTeamsAsync = function (teams) {
  var playersId = teams.reduce(function (p, team) {
    return p.concat(team.players.map(function (player) {
      if (typeof player === "string")
        return player; // player is an id
      return player.id;
    }).filter(function (p) { return p !== null && typeof p !== "undefined"; }));
  }, []);
  return DB.existAsync(DB.Model.Player, playersId)
           .then(function (exist) {
              if (!exist)
                throw "some player doesn't exist";
            });
};

// replace game.teams.players object by created players ids
DB.Model.Game.createOwnedPlayersAsync = function (teams, owner) {
  var promises = [];
  for (var teamIndex = 0; teamIndex < teams.length; ++teamIndex) {
    var team = teams[teamIndex];
    var players = team.players;
    for (var playerIndex = 0; playerIndex < players.length; ++playerIndex) {
      var player = players[playerIndex];
      if (typeof player !== "string" &&
          typeof player.id !== "string") {
        //
        // [FIXME] refactor this with POST /v2/players/
        //
        // creating owned anonymous player
        (function createOwnedAnonymousPlayer(teamIndex, playerIndex) {
          var p = new DB.Model.Player({
            name: player.name || "",
            rank: player.rank || "",
            type: "owned",
            owner: owner
          });
          // we need to handle the club
          var deferred = Q.defer();
          var ownedPlayerPromise = deferred.promise;
          if (player.club && player.club.id) {
            DB.Model.Club.findById(player.club.id, function (err, club) {
              deferred.resolve(club); // never fail !
            });
          } else {
            deferred.resolve(null);
          }
          promises.push(
            ownedPlayerPromise.then(function (club) {
              if (club) {
                p.club.id = club.id;
                p.club.name = club.name;
              }
              return DB.saveAsync(p)
                       .then(function (p) {
                          teams[teamIndex].players[playerIndex] = p.id;
                     });
            })
          );
        })(teamIndex, playerIndex);
      }
    }
  }
  return Q.all(promises);
};

// 51e8fd31cba93e9f5d-000023 => 51/e8/fd/31/51e8fd31cba93e9f5d-000023
DB.Model.File.idTypeToPathInfos = function (id, type) {
  // we will need a switch here (type)
  var ext = ".jpeg";
  var directory = id.substr(0, 10).match(/.{1,2}/g).join("/");
  var filename = id + ext;
  var path = directory + "/" + filename;
  return {
    directory: directory,
    filename: filename,
    path: path
  }
};

DB.Model.File.checksum = function (buffer) {
  return crypto.createHash('sha256')
               .update(buffer)
               .digest('hex');
};

DB.Model.findByIdAsync = function (model, id) {
  return Q.nfcall(model.findById.bind(model), id);
};

// custom JSON api
JSON.stringifyModels = function (m, options) {
  options = options || {};
  if (options && typeof options.virtuals === "undefined")
    options.virtuals = true;
  if (options && typeof options.transform === "undefined")
    options.transform = true;
  if (Array.isArray(m)) {
    return JSON.stringify(m.map(function (model) {
      return model.toObject(options);
    }));
  }
  return JSON.stringify(m.toObject(options));
};

// random api
if (Conf.env === "DEV") {
  DB.Model.Club.randomAsync = function () { return DB.getRandomModelAsync(DB.Model.Club); };
  DB.Model.Player.randomAsync = function () { return DB.getRandomModelAsync(DB.Model.Player); };
  DB.Model.Game.randomAsync = function () { return DB.getRandomModelAsync(DB.Model.Game); };
}

/**
 * @param object query string ex: ?playerid=...&token=...    or  ?fbid=...&token=...
 * @param object options      default=undefined
 * @return promise
 * 
 * options:
 *  facebook: true    allowing facebook auth (facebookid + token)
 */
DB.isAuthenticatedAsync = function (query, options) {
  // default auth: using our system (playerid & token)
  if (query.playerid && query.token) {
    return Q.nfcall(
      DB.Model.Player.findOne.bind(DB.Model.Player),
      {_id: query.playerid, token: query.token}
    );
  }
  // FIXME: move this in a "security object?"
  // fb app auth: using fbid + checksum  
  if (options && options.facebook && query.fbid && query.token) {
    var shasum = crypto.createHash('sha256');
    shasum.update(query.fbid + Conf.get("facebook.app.secret"));
    if (shasum.digest('hex') === query.token) {
      return Q.resolve(query.fbid);
    }
  }
  return Q.resolve(null);
};

module.exports = DB;
