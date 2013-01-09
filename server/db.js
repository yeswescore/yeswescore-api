var mongoose = require("mongoose"),
    Schema = mongoose.Schema,
    Conf = require("./conf.js"),
    Q = require("q");

mongoose.connection.on('error', function () { DB.status = "disconnected" });
mongoose.connection.on('connected', function () { DB.status = "connected" });
mongoose.connect(Conf.get("mongo.url"));

var DB = {
  status : "disconnected",
  
  // mongoose data.
  Definition: { },  // schema definitions
  Schema: { },      // mongoose schemas
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
DB.Definition.Club = {
  sport: String,
  date_creation: { type: Date, default: Date.now },
  name: String,
  nameSearchable: String,
  city: String
};
DB.Definition.Player = {
  nickname: String,
  nicknameSearchable: String,
  name: String,
  nameSearchable: String,
  date_creation: { type: Date, default: Date.now },
  date_modification: Date,
  password: { type: String, default: null },
  token: { type: String, default: DB.generateToken },
  rank: String,
  club: { type: Schema.Types.ObjectId, ref: "Club" },
  games: [ { type: Schema.Types.ObjectId, ref: "Game" } ],
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  type: { type: String, enum: [ "default", "owned" ], default: "default" }
};
DB.Definition.Team = {
  players: [ { type: Schema.Types.ObjectId, ref: "Player" } ],
  points: String
};
DB.Definition.StreamItem = {
  date_creation: { type: Date, default: Date.now },
  date_modification: Date,
  type: { type: String, enum: [ "comment" ] },
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  data: Schema.Types.Mixed
};
// WE must instantiate Team & Stream Schema FIRST.
DB.Schema.Team = new Schema(DB.Definition.Team);
DB.Schema.StreamItem = new Schema(DB.Definition.StreamItem);
// 
DB.Definition.Game = {
  date_creation: { type: Date, default: Date.now },
  date_modification: Date,
  date_start: { type: Date, default: Date.now },
  date_end: Date,
  owner: { type: Schema.Types.ObjectId, ref: "Player" },
  pos: {type: [Number], index: '2d'},
  country: String,
  city: String,
  citySearchable: String,
  sport: { type: String, enum: ["tennis"] },
  type: { type: String, enum: [ "singles", "doubles" ] },
  sets: String,
  teams: [ DB.Schema.Team ],
  stream: [ DB.Schema.StreamItem ]  
};

//
// Schemas
//
DB.Schema.Club = new Schema(DB.Definition.Club);
DB.Schema.Player = new Schema(DB.Definition.Player);
DB.Schema.Game = new Schema(DB.Definition.Game);
// Need to index some fields
DB.Schema.Club.pre('save', function (next) {
  if (this.name)
    this.nameSearchable = this.name.searchable();
  next();
});
DB.Schema.Player.pre('save', function (next) {
  if (this.nickname)
    this.nicknameSearchable = this.nickname.searchable();
  if (this.name)
    this.nameSearchable = this.name.searchable();
  next();
});
DB.Schema.Game.pre('save', function (next) {
  if (this.city)
    this.citySearchable = this.city.searchable();
  next();
});

// Hidden fields
var hiddenFields = [ "password", "token"];
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

// custom JSON api
JSON.stringifyModels = function (m, options) {
  options = options || {};
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
            club: club.id,
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
              club: club.id,
              games: [],
              type: "owned"
          });
      });
      return DB.saveAsync(anonymous);
   });
};

var testPlayersAsync = function () {
  DB.Model.Player.findOne({}).exec(function (err, player) {
    player.games.push(player);
    player.save(function (err, player) {
      console.log(JSON.stringify(player.toObject({virtual:true})));
    });
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
          status: "unknown",
          teams: [ ],
          stream: [ ]
        });
        
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
              { players: [ ownedplayer1.id ] },
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
          if (players[i*2].id === game.teams[0].players[0])
            players[i*2].games.push(game.id);
          else
            owned[i*2].owner = game.owner;
          if (players[i*2+1].id === game.teams[1].players[0])
            players[i*2+1].games.push(game.id);
          else
            owned[i*2+1].owner = game.owner;
        });
        
        // saving players
        DB.saveAsync(players).then(function () {
          DB.saveAsync(owned).then(function () {
            deferred.resolve();
          }, function (e) { deferred.reject(); console.log('error ' + e); } );
        }, function (e) { deferred.reject(); console.log('error ' + e); } );
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