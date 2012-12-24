// simple static server
var express = require('express')
  , app = express();

// undefined if nothing is found
var searchById = function (collection, id) {
   return collection.filter(function (o) { return o.id === id }).pop();
}
  
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
  *    players: [
  *      {
  *        id: string,
  *        pseudo: string,
  *        name: string,
  *        rank: string,
  *        club: {
  *          id: string,
  *          name: string
  *        }
  *      },
  *      {
  *        id: string,
  *        pseudo: string,
  *        name: string,
  *        rank: string,
  *        club: {
  *          id: string,
  *          name: string
  *        }
  *      }
  *    ]
  * }
  */
app.get('/v1/games/', function(req, res){
  // inlining DB data.
  var games = DB.games.map(function (game) {
    var playerA = searchById(DB.players, game.players[0]);
    var playerB = searchById(DB.players, game.players[1]);
    var clubA = searchById(DB.clubs, playerA.club);
    var clubB = searchById(DB.clubs, playerB.club);
    return {
      id: game.id,
      date_creation: game.date_creation,
      date_start: game.date_start,
      date_end: game.date_end,
      pos: game.pos,
      city: game.city,
      type: game.type,
      sets: game.sets,
      score: game.score,
      status: game.status,
      players: [
        {
          id: playerA.id,
          pseudo: playerA.pseudo,
          name: playerA.name,
          rank: playerA.rank,
          club: {
            id: clubA.id,
            name: clubA.name
          }
        },
        {
          id: playerB.id,
          pseudo: playerB.pseudo,
          name: playerB.name,
          rank: playerB.rank,
          club: {
            id: clubB.id,
            name: clubB.name
          }
        }
      ]
    }
  });
  // 
  var body = JSON.stringify(games);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

// searching a specific game
app.get('/v1/games/:id', function(req, res){
  var game = searchById(DB.games, req.params.id);
  var result = {};
  if (game) {
    // cloning game
    for (var i in game) {
      result[i] = game[i];
    }
    // inlining player.
    var playerA = searchById(DB.players, game.players[0]);
    var playerB = searchById(DB.players, game.players[1]);
    var clubA = searchById(DB.clubs, playerA.club);
    var clubB = searchById(DB.clubs, playerB.club);
    
    result = {
      id: game.id,
      date_creation: game.date_creation,
      date_start: game.date_start,
      date_end: game.date_end,
      pos: game.pos,
      city: game.city,
      type: game.type,
      sets: game.sets,
      score: game.score,
      status: game.status,
      players: [
        {
          id: playerA.id,
          pseudo: playerA.pseudo,
          name: playerA.name,
          rank: playerA.rank,
          club: {
            id: clubA.id,
            name: clubA.name
          }
        },
        {
          id: playerB.id,
          pseudo: playerB.pseudo,
          name: playerB.name,
          rank: playerB.rank,
          club: {
            id: clubB.id,
            name: clubB.name
          }
        }
      ]
    };
  };
  
  var body = JSON.stringify(result);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

// searching a specific player
app.get('/v1/players/:id', function(req, res){
  var player = searchById(DB.players, req.params.id);
  var result = {};
  if (player) {
    // cloning game
    for (var i in player) {
      result[i] = player[i];
    }
    // inlining player.
    var club = searchById(DB.clubs, player.club);
    result = {
      id: player.id,
      pseudo: player.pseudo,
      name: player.name,
      rank: player.rank,
      club: {
        id: club.id,
        name: club.name
      }
    };
  };
  
  var body = JSON.stringify(result);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

// searching a specific club
app.get('/v1/clubs/:id', function(req, res){
  var club = searchById(DB.clubs, req.params.id);
  var result = {};
  if (club) {
    // cloning game
    for (var i in club) {
      result[i] = club[i];
    }
    // FIXME: liste des joueurs du club, etc
    result = {
      id: club.id,
      name: club.name
    };
  }
  
  var body = JSON.stringify(result);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

app.listen(8080);

//
// Generating Fake Data
//

// helpers
// @see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date#Example.3a_ISO_8601_formatted_dates
function ISODateString(d){
  function pad(n){return n<10 ? '0'+n : n}
  return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z'
}

Array.prototype.random = function () { return this[Math.floor(Math.random() * this.length)] };

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
var generateFakeLocation = function () {
  // trying to generate longitude / latitude inside france :)
  return { long: 45 + Math.random() * 10, lat: Math.random() * 4 }
}
var generateFakeDateCreation = function () {
  // date entre il y a 2 et 3 h
  var secAgo = 3600 * 2 + Math.floor(Math.random() * 3600);
  var d = new Date(new Date().getTime() - secAgo * 1000);
  return ISODateString(d);
}
var generateFakeDateEnd = function () {
  // date entre il y a 0 et 1 h
  var secAgo = Math.floor(Math.random() * 3600);
  var d = new Date(new Date().getTime() - secAgo * 1000);
  return ISODateString(d);
}

// on simule une DB mongo
var DB = {};

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
   *   pseudo: string,
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
   *   pos: { long: float, lat: float }, // index geospatial
   *   country: string,
   *   city: string,
   *   type: string, // singles / doubles
   *   sets: string, // ex: 6,2;6,3  (precomputed)
   *   status: string, // ongoing, canceled, finished (precomputed)
   *   players: [
   *     string, // id
   *     string  // id
   *   ],
   *   stream: [
   *       FIXME: historique du match, action / date / heure / commentaire / video / photo etc
   *   ]
   */
];



var generateClubs = function () {
  var names = ["CAEN TC", "CAEN LA BUTTE", "LOUVIGNY TC", "MONDEVILLE USO", "CONDE SUR NOIREAU TC", "ARROMANCHE TENNIS PORT WILSON", "FLEURY TENNIS CLUB"];
  DB.clubs = names.map(function (clubName) {
    return {
      id: generateFakeId(),
      sport: "tennis",
      name: clubName,
      city: generateFakeCity()
    }
  });
}

var generatePlayers = function () {
  // generating 20 players
  for (var i = 0; i < 20; ++i) {
    var player = {
      id: generateFakeId(),
      pseudo: generateFakePseudo(),
      name: generateFakeFirstName() + " " + generateFakeName(),
      rank: "15/2",
      club: DB.clubs.random().id,
      games: [ ]
    };
    DB.players.push(player);
  }
}

var generateGames = function () {
  // generating 20 games
  /*
   *   id: string, // checksum hexa
   *   date_creation: string, // date iso 8601
   *   date_start: string, // date iso 8601
   *   date_end: string, // date iso 8601
   *   pos: { long: float, lat: float }, // index geospatial
   *   country: string,
   *   city: string,
   *   type: string, // singles / doubles
   *   sets: string, // ex: 6,2;6,3  (precomputed)
   *   status: string, // ongoing, canceled, finished (precomputed)
   *   players: [
   *     string, // id
   *     string  // id
   *   ],
   *   stream: [
   *       FIXME: historique du match, action / date / heure / commentaire / video / photo etc
   *   ]
   * */
  
  for (var i = 0; i < 20; ++i) {
    var date_creation = generateFakeDateCreation();
    var game = {
      id: generateFakeId(),
      date_creation: date_creation,
      date_start: date_creation, // different ?
      date_end: null,
      pos: generateFakeLocation(),
      country: "france",
      city: generateFakeCity(),
      type: "singles",
      sets: "",
      score: "",
      status: "unknown",
      players: [ ],
      stream: [ ]
    };

    // random pick match status, finished ? or ongoing ?
    game.status = ["ongoing", "finihed"].random();
    // 
    if (game.status === "finished") {
      // status finished
      game.date_end = generateFakeDateEnd();
      if (Math.random() > 0.5) {
        game.sets = "6/"+Math.floor(Math.random() * 5)+";6/"+Math.floor(Math.random() * 5);
        game.score = "2/0";
      } else {
        game.sets = Math.floor(Math.random() * 5)+"/6;"+Math.floor(Math.random() * 5)+"/6";
        game.sore = "0/2";
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
    var player1 = DB.players.random();
    var player2 = DB.players.random();
    while (player1 === player2) {
      player2 = DB.players.random();
    }
    game.players = [ player1.id, player2.id ];
    // associating game to players
    player1.games.push(game.id);
    player2.games.push(game.id);
    
    DB.games.push(game);
  }
}

// generating fake data at startup
generateClubs();
generatePlayers();
generateGames();