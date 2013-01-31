var mongoose = require("mongoose")
  , Schema = mongoose.Schema
  , Conf = require("./conf.js")
  , Q = require("q")
  , crypto = require("crypto");

mongoose.connection.on('error', function () { DB.status = "disconnected" });
mongoose.connection.on('connected', function () { DB.status = "connected" });
mongoose.connect(Conf.get("mongo.url"));

var DB = {
  status : "disconnected",
  
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
// fftid,name,ligue,zip,city,outdoor,indoor,countPlayers,countPlayers1AN,countTeams,countTeams1AN,school
DB.Definition.Club = {
  sport: String,
  date_creation: { type: Date, default: Date.now },
  date_update: { type: Date, default: Date.now },
  name: String,
  city: String,
  pos: {type: [Number], index: '2d'},
  address: String,
  fftid: String,
  ligue: String,
  zip: String,
  outdoor: Number,
  indoor: Number,
  countPlayers: Number,
  countPlayers1AN: Number,
  countTeams: Number,
  countTeams1AN: Number,
  school: String,
  // private searchable fields
  _searchableName: String  // AUTO-FIELD (Club pre save)
};
DB.Definition.Player = {
  nickname: String,
  name: String,
  date_creation: { type: Date, default: Date.now },
  date_update: { type: Date, default: Date.now },
  email: String,
  idlicense: String,
  password: { type: String, default: null },
  token: { type: String, default: DB.generateToken },
  rank: String,
  club: {
    id: { type: Schema.Types.ObjectId, ref: "Club" },
    name: String // AUTO-FIELD (Player pre save)
  },
  games: [ { type: Schema.Types.ObjectId, ref: "Game" } ], // AUTO-FIELD (Game post save)
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  type: { type: String, enum: [ "default", "owned" ], default: "default" },
  // private searchable fields
  _searchableNickname: String,  // AUTO-FIELD (Player pre save)
  _searchableName: String,      // AUTO-FIELD (Player pre save)
  _searchableClubName: String   // AUTO-FIELD (Player pre save)
};
DB.Definition.Team = {
  players: [ { type: Schema.Types.ObjectId, ref: "Player" } ],
  points: String
};
DB.Definition.StreamItem = {
  date_creation: { type: Date, default: Date.now },
  date_update: { type: Date, default: Date.now },
  fbid: String,
  type: { type: String, enum: [ "comment" ] },
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  data: Schema.Types.Mixed
};
// WE must instantiate Team & Stream Schema FIRST.
DB.Schema.Team = new Schema(DB.Definition.Team);
DB.Schema.StreamItem = new Schema(DB.Definition.StreamItem);
// 
DB.Definition.Game = {
  // dates
  date_creation: { type: Date, default: Date.now },
  date_update: { type: Date, default: Date.now },
  date_start: { type: Date, default: Date.now },
  date_end: Date,
  // 
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  // address / geolocalisation
  pos: {type: [Number], index: '2d'},
  country: String,
  city: String,
  // 
  sport: { type: String, enum: ["tennis"] },
  status: { type: String, enum: [ "ongoing", "finished", "canceled" ], default: "ongoing" },
  // game options, different depending on sport
  type: { type: String, enum: [ "singles", "doubles" ] },
  subtype: { type: String, enum: [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ] },
  sets: String,
  score: String,
  court: { type: String, enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
                                "A", "B", "C", "D", "E", "F", "" ] },
  surface: { type: String, enum: ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ", 
                                  "NVTB", "PAR", "RES", "TB", "" ] },
  tour: String,
  //
  teams: [ DB.Schema.Team ],
  stream: [ DB.Schema.StreamItem ],
  // private searchable fields
  _searchableCity: String,                                // AUTO-FIELD (Game pre save)
  _searchablePlayersNames: [ String ],                    // AUTO-FIELD (Player post save) ASYNC
  _searchablePlayersNickNames: [ String ],                // AUTO-FIELD (Player post save) ASYNC
  _searchablePlayersClubsIds: [ Schema.Types.ObjectId ],  // AUTO-FIELD (Player post save) ASYNC
  _searchablePlayersClubsNames: [ String ]                // AUTO-FIELD (Player post save) ASYNC
};

//
// Schemas
//
DB.Schema.Club = new Schema(DB.Definition.Club);
DB.Schema.Player = new Schema(DB.Definition.Player);
DB.Schema.Game = new Schema(DB.Definition.Game);

// password virtual setter
DB.Schema.Player.virtual('uncryptedPassword').set(function (uncryptedPassword) {
  var shasum = crypto.createHash('sha256');
  shasum.update(uncryptedPassword+Conf.get("security.secret"));
  this.password = shasum.digest('hex');
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
 *  - update searchableNickname
 *  - update searchableName
 *  - update searchableClubName
 */
DB.Schema.Player.pre('save', function (next) {
  if (this.isModified("games") && this.games.length !== 0)
    throw "should not save games "+JSON.stringify(this);
  // infos for post save
  this._wasModified = [];
  // player._searchableNickname
  if (this.isModified('nickname')) {
    this._wasModified.push('nickname');
    this._searchableNickname = this.nickname.searchable();
  }
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
    DB.Model.Club.findById(this.club.id, function (err, club) {
      if (err)
        return next(); // FIXME: log.
      self.club.name = club.name;
      self._searchableClubName = club.name.searchable();
      next();
    });
  } else {
    next();
  }
});

//
// Optim: post('exec', ...) => 
//     save in _dbValue = [ nickname, name, ... ]
//  => prevent populate :
//   - find(...).exec(
//       $pull: oldPlayerName
//   )
//

/*
 * After saving a player we might need to 
 *  - update Game searchableNickname
 *  - update Game searchableName
 *  - update Game searchableClubName
 *  - update Game searchableClubId
 */
DB.Schema.Player.post('save', function () {
  // SUPER HEAVY PLAYER GAMES UPDATE
  // SHOULD BE DISPATCHED TO A WORKER, ASYNC STUFF.
  if (this._wasModified.indexOf("name") === -1 &&
      this._wasModified.indexOf("nickname") === -1 &&
      this._wasModified.indexOf("club") === -1)
    return;

  var wasModified = this._wasModified; // is garbage collected by mongoose ?
  
  // ASYNC STUFF HERE
  // maybe we should use player.games
  DB.Model.Game.find({"teams.players": this.id})
                .select("teams")
                .populate("teams.players")
                .exec(function (err, games) {
    if (err)
      return; //FIXME: log
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
      if (wasModified.indexOf("nickname") !== -1) {
        game._searchablePlayersNickNames = game.teams.reduce(function (p, team) {
          return p.concat(team.players.map(function (player) {
            return player.nickname.searchable();
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
 *  - update searchableNickname   (teams were modified)
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
  if (this.isModified('city'))
    this._searchableCity = this.city.searchable();
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
        this._searchablePlayersNickNames = players.map(function (p) { return p.nickname.searchable() });
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
        Object.keys(ret).forEach(function (key) {
          if (key[0] === "_") delete ret[key];
        });
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

DB.Model.Game.checkFields = function (game, fields) {
  // FIXME: can some tests be done with express ? or mongoose ?
  fields = fields || [];
  if (fields.indexOf("sport") !== -1 && game.sport && game.sport !== "tennis")
    return "wrong sport (tennis only)";
  // check type
  if (fields.indexOf("singles") !== -1 && game.type && game.type !== "singles")
    return "wrong type (singles only)";
  // check status
  if (fields.indexOf("status") !== -1 && game.status && game.status !== "ongoing" && game.status !== "finished" && game.status !== "canceled")
    return "wrong status (ongoing/finished)";
  // check teams
  if (fields.indexOf("teams") !== -1 && game.teams) {
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
  if (fields.indexOf("court") !== -1 && game.court &&
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
       "A", "B", "C", "D", "E", "F", "" ].indexOf(game.court) === -1)
    return "wrong court (1-11, A-F or empty)";
  if (fields.indexOf("subtype") !== -1 && game.subtype &&
      [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ].indexOf(game.subtype) === -1)
    return "wrong subtype (A-F)";
  if (fields.indexOf("surface") !== -1 && game.surface &&
      ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ", 
       "NVTB", "PAR", "RES", "TB", "" ].indexOf(game.surface) === -1)
    return "wrong surface (BP,EP,EPDM,GAS,GAZ,MOQ,NVTB,PAR,RES,TB or empty";
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
        // [FIXME] refactor this with POST /v1/players/
        //
        // creating owned anonymous player
        (function createOwnedAnonymousPlayer(teamIndex, playerIndex) {
          var p = new DB.Model.Player({
            name: player.name || "",
            nickname: player.nickname || "",
            email: player.email || "",
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


// fonctions de generation de contenu
var generateFakeId = function () { 
  var s = ""
    , hexa = "0123456789abcdef";
    
  for (var i = 0; i < 24; ++i)
    s += hexa[Math.floor(Math.random() * hexa.length)];
  return s
}
var generateFakeName = function () {
  return [ "Garcia", "Blanc", "Serra", "Guisset", "Martinez", "Mas", "Pla", "Sola", "Lopez", "Torrès", "Gil", "Richard",
           "Sanchez", "Simon", "Esteve", "Salvat", "Vidal", "Bertrand", "Bonnet", "Mestres", "Perez", "Batlle" ].random();
}
var generateFakeFirstName = function () {
  return [ "Agathe","Aliénor","Alix","Ambre","Apolline","Athénaïs","Axelle","Camille","Capucine","Celeste","Charlotte",
           "Chloé","Clarisse","Emma","Eva","Gabrielle","isaure","Jade","Juliette","leonore","Louise","Margaux","Mathilde",
           "Maya","Romane","Rose","Roxane","Violette","Zélie","Zoé"].random();
}
var generateFakePseudo = function () {
  return [ "Lamasperge","Kenex","JuniorGong","TelQuel","Danka","CanardPC","Mormon","DoofyGilmore","Cawotte_","Perle_Blanche","Ggate",
           "C0mE_oN_And_TrY","drj-sg","JavierHernandez","noelstyle","BadReputation","GrenierDuJoueur","CumOnAndTry","LosAngeles",
           "PetDeHap","idontknowhy","PEPSl","FenetrePVC","20thCenturyBoy","Titilabille","[B2OOBA]","SmashinPumpkins","Despe","EveryoneSuck","8mai1945"].random();
}
var generateFakeCity = function () {
  return [ "Bayeux", "Falaise", "Caen", "Honfleur", "Deauville", "Arromanches les Bains", "Lisieux", "Cabourg",
           "Trouville sur Mer", "Mont Saint Michel", "Cherbourg" ].random();
}
var generateFakeComment = function () {
  return [
   "Merci!",
   "Je t'ai ajouté! :D",
   "Lol, c'te gros tocard.",
   "j'arrive pas à faire venir Roger à mon Open 13 et ça me fout les boules.",
   "C'est EXACTEMENT ça, Franchement pour dire ça faut vraiment être d'une mauvaise foi incomparable ou n'y rien connaître au tennis. On peut ne pas aimer Federer mais ne pas reconnaître qu'il fait le show...",
   "Sous entendu : Désolé de cette interview de merde. je dois vite me retirer et crever très vite. Ciao. ",
   "Haha on sent le mec frustré qui veut se démarquer de la masse en critiquant Federer alors que tout le monde l'adule. \
\
Ou alors c'est juste que pour lui, spectacle = faire le gorille et le clown sur le terrain... \
\
Et le \"s'il n'était pas numéro 3 on en parlerait pas autant\"   dans le genre \"j'ai aucun argument pour descendre Federer, donc j'en invente un bien débile\" \
\
Ah mais c'est sûr, si Federer n'avait pas gagné 17 GC, on n'en parlerait pas autant ! ",
   "C'était pas lui qui disait que la victoire de Federer à Bercy était sa plus belle édition parce qu'il était fan et tout et tout ?",
   "Ah ben comme ça on est fixé sur la venue de Federer à l'open 13 (bon y avait pas trop de suspens   ) ",
   "Enfin quelqu'un qui ose dire les vrais choses   \
Lui c'est un vrai connaisseur  ",
   "Jean-François Couillemolle.",
   "Il a fait le bon choix le Caujolle, je préfère qu'il nous achète Berdych, Delpo et Tipsarevic plutôt que l'autre mannequin pour montres. Cela aurait été clairement mieux qu'il se débarasse aussi de Tsonga et Gasquet qui génèrent vraiment trop de vacarme dans les gradins (pour les remplacer par des joueurs moins chers et moins bruyants comme par exemple Cilic, Nishikori, Haas), mais on ne peut pas trop lui en vouloir, c'est du bon boulot pour JF.",
   "Bah, vas-y, ramène Djokovic alors.  ",
   "Enfin quelqu'un qui ose le critiquer. \
    Bravo très bon article"
  ].random();
}
var generateFakeLocation = function () {
  // trying to generate longitude / latitude inside france :)
  return { long: 45 + Math.random() * 10, lat: Math.random() * 4 }
}
var generateFakeDateCreation = function () {
  // date entre il y a 2 et 3 h
  var secAgo = 3600 * 2 + Math.floor(Math.random() * 3600);
  return new Date(new Date().getTime() - secAgo * 1000).toISO();
}
var generateFakeDateEnd = function () {
  // date entre il y a 0 et 1 h
  var secAgo = Math.floor(Math.random() * 3600);
  return new Date(new Date().getTime() - secAgo * 1000).toISO();
}

DB.clubs = [
  /*
   * document club :
   * {
   *   id: string, // checksum hexa
   *   sport: string,
   *   name: string,
   *   city: string
   *   FIXME (address, telephone, nb joueurs, ...)
   * }
   */
];

DB.players = [ 
  /*
   * document player :
   * {
   *   id: string, // checksum hexa
   *   nickname: string,
   *   name: string,
   *   password: string, // checksum hexa
   *   rank: string,
   *   club: string, // id 
   *   games: [
   *      string, // id
   *      string, // id
   *      ...
   *   ]
   *   FIXME: (poid, taille, adresse, infos perso, ...)
   */
];

DB.games = [
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
   *     { id: null, players: [ { id: string }, ... ] },
   *     { id: null, players: [ { name: string }, ... ] }
   *   ],
   *   stream: [
   *       FIXME: historique du match, action / date / heure / commentaire / video / photo etc
   *   ]
   */
];



var generateClubsAsync = function () {
  var names = ["CAEN TC", "CAEN LA BUTTE", "LOUVIGNY TC", "MONDEVILLE USO", "CONDE SUR NOIREAU TC", "ARROMANCHE TENNIS PORT WILSON", "FLEURY TENNIS CLUB"];
  var clubs = names.map(function (clubName) {
    return new DB.Model.Club({
      sport: "tennis",
      name: clubName,
      city: generateFakeCity()
    });
  });
  return DB.saveAsync(clubs);
};

var generatePlayersAsync = function () {
  // reading random club
  var nbPlayers = 40;
  var randomClubs = [];
  for (var i = 0; i < nbPlayers; ++i) {
     randomClubs.push(DB.getRandomModelAsync(DB.Model.Club));
  }
  var gClubs;
  return Q.all(randomClubs)
          .then(function (clubs) {
     gClubs = clubs;
     var players = clubs.map(function (club) {
        return new DB.Model.Player({
            nickname: generateFakePseudo(),
            name: generateFakeFirstName() + " " + generateFakeName(),
            rank: "15/2",
            club: {
              id: club.id,
              name: club.name
            },
            games: [],
            type: "default"
        });
     });
     return DB.saveAsync(players);
   }).then(function (players) {
      var anonymous = gClubs.map(function (club) {
          return new DB.Model.Player({
              nickname: generateFakePseudo(),
              name: generateFakeFirstName() + " " + generateFakeName(),
              rank: "15/2",
              club: {
                id: club.id,
                name: club.name
              },
              games: [],
              type: "owned"
          });
      });
      return DB.saveAsync(anonymous);
   });
};

var generateGamesAsync = function () {
  // generating 20 games
  var deferred = Q.defer();
  
  DB.Model.Player.find({type:"default"})
                 .exec(function (err, players) {
    if (err)
      return deferred.reject();
    DB.Model.Player.find({type:"owned"})
                   .exec(function (err, owned) {
      if (err)
        return deferred.reject();
      // Youpi.
      var games = [];
      var nbGames = 20;
      
      for (var i = 0; i < nbGames; ++i) {
        var owner = players.random().id;
        
        var game = new DB.Model.Game({
          owner: owner, // utilisateur ayant saisi le match.
          pos: generateFakeLocation(),
          country: "france",
          city: generateFakeCity(),
          type: "singles",
          sets: "",
          score: "",
          sport: "tennis",
          status: "ongoing",
          teams: [ ],
          stream: [ ]
        });
        
        //
        game.subtype = [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ].random();
        game.court = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
                      "A", "B", "C", "D", "E", "F", "" ].random();
        game.surface = ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ", 
                        "NVTB", "PAR", "RES", "TB", "" ].random();
        game.tour = [ "Poule", "consolante", "1er tour", "2nd tour" ].random();
        
        // random pick match status, finished ? or ongoing ?
        game.status = ["ongoing", "finished"].random();
        // 
        if (game.status === "finished") {
          // status finished
          game.date_end = generateFakeDateEnd();
          if (Math.random() > 0.5) {
            game.sets = "6/"+Math.floor(Math.random() * 5)+";6/"+Math.floor(Math.random() * 5);
            game.score = "2/0";
          } else {
            game.sets = Math.floor(Math.random() * 5)+"/6;"+Math.floor(Math.random() * 5)+"/6";
            game.score = "0/2";
          }
        } else {
          // status ongoing
          if (Math.random() > 0.5) {
            // 2 set
            if (Math.random() > 0.5) {
              game.sets = "6/"+Math.floor(Math.random() * 5)+";"+Math.floor(Math.random() * 5)+"/"+Math.floor(Math.random() * 5);
              game.score = "1/0";
            } else {
              game.sets = Math.floor(Math.random() * 5)+"/6;"+Math.floor(Math.random() * 5)+"/"+Math.floor(Math.random() * 5);
              game.score = "0/1";
            }
          } else {
            // 1 set
            game.sets = Math.floor(Math.random() * 5)+"/"+Math.floor(Math.random() * 5);
            game.score = "0/0";
          }
        }
        
        // generating players
        var player1 = players[i*2];
        var player2 = players[i*2+1];
        var ownedplayer1 = owned[i*2];
        var ownedplayer2 = owned[i*2+1];
        
        // sometimes, players are "anonymous"
        if (Math.random() < 0.2) {
          if (Math.random() < 0.3) {
            game.teams = [
              { players: [ ownedplayer1.id ] },
              { players: [ ownedplayer2.id ] } 
            ];
          } else {
            if (Math.random() < 0.5) {
              game.teams = [
                { players: [ ownedplayer1.id ] },
                { players: [ player2.id ] }
              ];
            } else {
              game.teams = [
                { players: [ player1.id ] },
                { players: [ ownedplayer2.id ] }
              ];
            }
          }
        } else {
          game.teams = [
            { players: [ player1.id ] },
            { players: [ player2.id ] }
          ];
        }
        
        // generating 0 to 10 comments
        var nbComments = Math.floor(Math.random() * 11);
        var delta = 0;
        for (var j = 0; j < nbComments; ++j) {
          // adding random (1 to 5) minutes
          delta += 1000 * 60 * (1 + Math.floor(Math.random(5)));
          var date = new Date(new Date(game.date_start).getTime() + delta);
          var comment = {
            type: "comment",
            owner: players.random().id,
            data: { text: generateFakeComment() }
          }
          game.stream.push(comment);
        }
        
        games.push(game);
      }

      DB.saveAsync(games).then(function (games) {
        games.forEach(function (game, i) {
          // adding games to players
          if (players[i*2].id !== game.teams[0].players[0])
            owned[i*2].owner = game.owner;
          if (players[i*2+1].id !== game.teams[1].players[0])
            owned[i*2+1].owner = game.owner;
        });
        
        // saving players
        DB.saveAsync(owned).then(function () {
          deferred.resolve();
        }, function (e) { deferred.reject(); } );
      });
    });
  });
  return deferred.promise;
};

DB.dropCollection = function (collectionName) {
  var deferred = Q.defer();
  if (Conf.env === "DEV") {
    if (DB.status === "connected") {
      mongoose.connection.collections[collectionName].drop( function(err) {
        if (err)
          deferred.reject("error dropping collection");
        deferred.resolve("collection dropped");
      });
    } else {
      deferred.reject("not connected");
    }
  }
  else {
    deferred.reject("drop collection only allowed on dev environment");
  }
  return deferred.promise;
};

DB.reset = function () {
  if (Conf.env === "DEV") {
    return Q.allResolved([
      DB.dropCollection("clubs"),
      DB.dropCollection("players"),
      DB.dropCollection("games")
    ]);
  }
  // FIXME: warning, should never be here 
  return Q.allResolved([]);
};

// generating fake data at startup (DEV ONLY)
mongoose.connection.once("open", function () {
  if (Conf.env === "DEV") {
    DB.reset().then(function () {
      DB.generateFakeData();
    });
  }
});

DB.generateFakeData = function () {
  generateClubsAsync()
   .then(generatePlayersAsync)
   .then(generateGamesAsync)
   .then(function () {
     console.log('FAKE DATA GENERATED');
   });
};

// undefined if nothing is found
DB.searchById = function (collection, id) {
   return collection.filter(function (o) { return o.id === id }).pop();
};

DB.isAuthenticatedAsync = function (query) {
  var deferred = Q.defer();
  if (query.playerid && query.token) {
    DB.Model.Player.findOne({_id: query.playerid, token: query.token})
                   .exec(function (err, player) {
                      if (err)
                        deferred.reject(err);
                      else
                        deferred.resolve(player);
                   });
  } else {
    deferred.resolve(null); // no player.
  }
  return deferred.promise;
};

DB.generateFakeId = generateFakeId;
DB.generateFakeName = generateFakeName;

module.exports = DB;