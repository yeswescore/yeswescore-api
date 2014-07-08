var DB = require('../../server/db.js')
  , Q = require('q');

// will export only a function.
var Data = { };

// fonctions de generation de contenu
var generateFakeId = function () { 
  var s = ""
    , hexa = "0123456789abcdef";
    
  for (var i = 0; i < 24; ++i)
    s += hexa[Math.floor(Math.random() * hexa.length)];
  return s
}
var generateFakeName = function () {
  return [ "Garcia", "Blanc", "Serra", "Guisset", "Martinez", "Mas", "Pla", "Sola", "Lopez", "Tors", "Gil", "Richard",
           "Sanchez", "Simon", "Esteve", "Salvat", "Vidal", "Bertrand", "Bonnet", "Mestres", "Perez", "Batlle" ].random();
}
var generateFakeFirstName = function () {
  return [ "Agathe","Alinor","Alix","Ambre","Apolline","Athnaïs","Axelle","Camille","Capucine","Celeste","Charlotte",
           "Chloé","Clarisse","Emma","Eva","Gabrielle","isaure","Jade","Juliette","leonore","Louise","Margaux","Mathilde",
           "Maya","Romane","Rose","Roxane","Violette","Zélie","Zoé"].random();
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
   "C'est EXACTEMENT ça, Franchement pour dire ça faut vraiment être d'une mauvaise foi incomparable ou n'y rien connaitre au tennis. On peut ne pas aimer Federer mais ne pas reconnaitre qu'il fait le show...",
   "Sous entendu : Désolé de cette interview de merde. je dois vite me retirer et crever très vite. Ciao. ",
   "Haha on sent le mec frustré qui veut se démarquer de la masse en critiquant Federer alors que tout le monde l'adule. \
\
Ou alors c'est juste que pour lui, spectacle = faire le gorille et le clown sur le terrain... \
\
Et le \"s'il n'était pas numéro 3 on en parlerait pas autant\"   dans le genre \"j'ai aucun argument pour descendre Federer, donc j'en invente un bien débile\" \
\
Ah mais c'est sur, si Federer n'avait pas gagné 17 GC, on n'en parlerait pas autant ! ",
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
  return [ Math.random() * 4, 45 + Math.random() * 10 ]
}
var generateFakeDateCreation = function () {
  // date entre il y a 2 et 3 h
  var secAgo = 3600 * 2 + Math.floor(Math.random() * 3600);
  return new Date(new Date().getTime() - secAgo * 1000).toISO();
}

var generateFakeDateBirth = function () {
  // date entre il y a 2 et 3 h
  var secAgo = 3600 * 2 + Math.floor(Math.random() * 3600);
  return new Date(new Date().getTime() - secAgo * 100000000).toISO();
}

var generateFakeDateEnd = function () {
  // date entre il y a 0 et 1 h
  var secAgo = Math.floor(Math.random() * 3600);
  return new Date(new Date().getTime() - secAgo * 1000).toISO();
}

var generateClubsAsync = function () {
  var names = ["CAEN TC", "CAEN LA BUTTE", "LOUVIGNY TC", "MONDEVILLE USO", "CONDE SUR NOIREAU TC", "ARROMANCHE TENNIS PORT WILSON", "FLEURY TENNIS CLUB"];
  var clubs = names.map(function (clubName) {
    return new DB.Models.Club({
      sport: "tennis",
      name: clubName,
      location: {
        address: "random adress " + Math.random(),
        city: generateFakeCity(),
        zip: "zip"+Math.random(),
        pos: generateFakeLocation()
      },
      ligue: "ligue"+Math.random(),
      outdoor: Math.round(Math.random() * 10),
      indoor: Math.round(Math.random() * 10),
      countPlayers: Math.round(Math.random() * 100),
      countPlayers1AN: Math.round(Math.random() * 100),
      countTeams: Math.round(Math.random() * 10),
      countTeams1AN: Math.round(Math.random() * 10),
      school: "school"+Math.random()
    });
  });
  return DB.save(clubs);
};

var generatePlayersAsync = function () {
  // reading random club
  var nbPlayers = 40;
  var randomClubs = [];
  for (var i = 0; i < nbPlayers; ++i) {
     randomClubs.push(DB.Models.Club.getRandomModel());
  }
  var gClubs;

  return Q.all(randomClubs)
          .then(function (clubs) {
     gClubs = clubs;
     var players = clubs.map(function (club) {
        var clubInfo = {
          id: club.id,
          name: club.name
        };
        if (Math.random() > 0.7)
          clubInfo = undefined;
        return new DB.Models.Player({
            name: generateFakeFirstName() + " " + generateFakeName(),
            location: {
              currentPos: generateFakeLocation(),
              city: generateFakeCity(),
              address: "random adress " + Math.random(),
        	  zip: "zip"+Math.random()
            },
            dates: {
              birth : generateFakeDateBirth()
            },
            push: {
              platform : [ "android", "ios", "wp8", "bb" ].random(),
              token :  generateFakeId()
            },
            gender : [ "man", "woman" ].random(),
            rank: "15/2",
            club: clubInfo,
            games: [],
            type: "default"
        });
     });
     return DB.save(players);
   }).then(function (players) {
      var anonymous = gClubs.map(function (club) {
        var clubInfo = {
          id: club.id,
          name: club.name
        };
        if (Math.random() > 0.7)
          clubInfo = undefined;
        return new DB.Models.Player({
            name: generateFakeFirstName() + " " + generateFakeName(),
            location: {
              country: "",
              pos: []
            },
            rank: "15/2",
            club: clubInfo,
            games: [],
            type: "owned"
        });
      });
      return DB.save(anonymous);
   });
};

var generateGamesAsync = function () {
  // generating 20 games
  var players, owned, games = [];
  return Q.all([
    Q.nfcall(DB.Models.Player.find.bind(DB.Models.Player), {type:"default"})
     .then(function (result) { players = result }),
    Q.nfcall(DB.Models.Player.find.bind(DB.Models.Player), {type:"owned"})
     .then(function (result) { owned = result })
  ]).then(function () {
    var nbGames = 20;

    for (var i = 0; i < nbGames; ++i) {
      var owner = players.random().id;
      var game = new DB.Models.Game({
        sport: ["tennis", "tennis", "tennis", "tennis", "tennis", "tennis", "tennis", "tennis", "tennis", "squash"].random(),
        status: ["ongoing", "finished"].random(),
        owner: owner, // utilisateur ayant saisi le match.
        location: {
          country: "france",
          city: generateFakeCity(),
          pos: generateFakeLocation()
        },
        teams: [ ],
        stream: [ ],
        dates: [ ],
        infos: {
          type: "singles",
          subtype: [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ].random(),
          sets: "",
          score: "",
          court: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
                    "A", "B", "C", "D", "E", "F", "" ].random(),
          surface: ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ",
                      "NVTB", "PAR", "RES", "TB", "" ].random(),
          tour: [ "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"  ].random(),
          pro : [true, false, false, false, false, false, false, false, false, false, false, false].random(),
          official : [true, false].random(),
          numberOfBestSets: [3,5,undefined].random()
        }
      });

      if (game.status === "finished") {
        // status finished
        game.dates.end = generateFakeDateEnd();
        if (Math.random() > 0.5) {
          game.infos.sets = "6/"+Math.floor(Math.random() * 5)+";6/"+Math.floor(Math.random() * 5);
          game.infos.score = "2/0";
        } else {
          game.infos.sets = Math.floor(Math.random() * 5)+"/6;"+Math.floor(Math.random() * 5)+"/6";
          game.infos.score = "0/2";
        }
      } else {
        // status ongoing
        if (Math.random() > 0.5) {
          // 2 set
          if (Math.random() > 0.5) {
            game.infos.sets = "6/"+Math.floor(Math.random() * 5)+";"+Math.floor(Math.random() * 5)+"/"+Math.floor(Math.random() * 5);
            game.infos.score = "1/0";
          } else {
            game.infos.sets = Math.floor(Math.random() * 5)+"/6;"+Math.floor(Math.random() * 5)+"/"+Math.floor(Math.random() * 5);
            game.infos.score = "0/1";
          }
        } else {
          // 1 set
          game.infos.sets = Math.floor(Math.random() * 5)+"/"+Math.floor(Math.random() * 5);
          game.infos.score = "0/0";
        }
      }

      //expected : ["01/01/1970",Date.now()].random()
      if (Math.random()>0.5)
        game.dates.expected = Date.now();

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
        var date = new Date(new Date(game.dates.start).getTime() + delta);
        var comment = {
          type: "comment",
          owner: { player: players.random().id },
          data: { text: generateFakeComment() },
          dates: { creation: Date.now() + 10 * j }
        }
        game.stream.push(comment);
      }
      //
      game.streamCommentsSize = game.stream.length;
      game.streamImagesSize = 0;
      //
      games.push(game);
    }
    return DB.save(games);
  }).then(function (games) {
    // for several games, choosing a startTeam
    games.forEach(function (game, i) {
      if (Math.random() < 0.5) {
        if (Math.random() < 0.5) {
          game.infos.startTeam = game.teams[0].id;
        } else {
          game.infos.startTeam = game.teams[1].id;
        }
      }
    });
    return DB.save(games);
  }).then(function (games) {
    games.forEach(function (game, i) {
      // adding games to players
      if (players[i*2].id !== game.teams[0].players[0])
        owned[i*2].owner = game.owner;
      if (players[i*2+1].id !== game.teams[1].players[0])
        owned[i*2+1].owner = game.owner;
    });
    // saving players
    return DB.save(owned);
  });
};

var generateTeamsAsync = function () {
  var nbTeams = 2;
  var randomClubs = [];
  for (var i = 0; i < nbTeams; ++i) {
     randomClubs.push(DB.Models.Club.getRandomModel());
  }
  var gClubs = null;
  return Q.all(randomClubs)
    .then(function (clubs) {
      gClubs = clubs;
      return Q.nfcall(DB.Models.Player.find.bind(DB.Models.Player),
                      {type:"default"});
    }).then(function (players) {
      // creating 2 random teams with 1 to N players
      var teams = [], team, teamPlayers;
      for (var i = 0; i < 2; ++i) {
        teamPlayers = players.splice(
            Math.round(Math.random() * players.length / 2) + 1,
            Math.round(Math.random() * players.length / 3) + 1
        );
        teamPlayersSubstitutes = players.splice(
            Math.round(Math.random() * players.length / 2) + 1,
            Math.round(Math.random() * players.length / 5)
        );
        team = new DB.Models.Team({
          sport: 'tennis',
          name: ['Equipe A', 'Equipe B', 'Equipe C'].random(),
          players: teamPlayers,
          captain: teamPlayers.random(),
          substitutes: teamPlayersSubstitutes,
          captainSubstitute: teamPlayersSubstitutes.random(), // might crash ?
          club: gClubs.random().id,
          competition: [true,false].random()
        });
        teams.push(team);
      }
      return DB.save(teams);
  }, function (err) { console.log('error ' + err); });
};

Data.generateFakeDataAsync = function () {
  return generateClubsAsync().then(function () { console.log('generate clubs finished'); })
   .then(generatePlayersAsync).then(function () { console.log('generate players finished'); })
   .then(generateGamesAsync).then(function () { console.log('generate games finished'); })
   .then(generateTeamsAsync).then(function () { console.log('generate teams finished'); })
   .then(function () {
      console.log('FAKE DATA GENERATED');
    }, function (e) {
      console.log('error generating data : ' + e, 'error');
    });
};

module.exports = Data;

