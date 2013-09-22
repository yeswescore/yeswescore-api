var csv = require('csv')
  , fs = require('fs')
  , DB = require('../server/db.js')
  , Conf = require('../server/conf.js')
  , Q = require('q')
  , mongoose = require('mongoose');

// mongo connection
mongoose.connection.on('error', function () {
  console.log('mongo: disconnected');
});
mongoose.connection.on('connected', function () {
  console.log('mongo: connected');
  connected();
});
var mongoUrl = "mongodb://localhost/stats"
mongoose.connect(mongoUrl);
console.log('connecting to '+mongoUrl);

// raw stats.
var rawStats = [];
// stats by player
var statsByPlayer = {
  "anonymous": []
};
var playersById = {};

function connected() {
  csv()
    .from.stream(fs.createReadStream(process.env['HOME']+"/tmp/stats/stats.csv"))
    .transform(function (row, index) {
      return (index) ? row : null;
    })
    .on('record', function (row) {
      rawStats.push(row);
      var playerid = row[1];
      if (typeof playerid === "string" && playerid.length) {
        if (typeof statsByPlayer[playerid] === "undefined")
          statsByPlayer[playerid] = [];
        statsByPlayer[playerid].push(row);
      } else {
        statsByPlayer["anonymous"].push(row);
      }
    })
    .on('end', function(count){
      console.log('csv processing finished');
      readPlayers();
    })
    .on('error', function(error){
      console.log(error.message);
      process.exit(0);
    });
}

// 
function readPlayers() {
  // display statsByPlayer : id => nb startups
  var promises = [];
  var playersIds = [];
  for (var playerid in statsByPlayer) {
    // on recherche des infos sur le player en question dans mongo
    if (playerid !== "anonymous") {
      playersIds.push(playerid);
      var promise = Q.ninvoke(DB.Models.Player, 'findById', playerid);
      promises.push(promise);
    }
  }
  console.log(promises.length + ' player searched in mongo');
  Q.all(promises)
   .then(function (players) { 
     console.log(players.length + ' players found in mongo');
     // players by id.

     for (var i = 0; i < players.length; ++i) {
       if (players[i] === null) {
         console.log("some player exists in stat but not in DB ? (" + playersIds[i] + ")");
         continue;
       }
       playersById[players[i].id] = players[i];
     }
     // start processing data
     start();

   }).then(function () { },
           function (e) { console.log('error ' + e); process.exit(1); });
}

function start() {
  fs.writeFile("public/stats.json", JSON.stringify(rawStats), function(err) {
    if(err) {
      console.log(err);
      process.exit(1);
    }
    fs.writeFile("public/players.json", JSON.stringify(playersById), function(err) {
      if(err) {
        console.log(err);
        process.exit(1);
      }
      console.log('everything went ok');
      process.exit(0);
    });
  });
}
  
  
  /*
  try {
    
    console.log('START');
    // analysing startups.
    for (var playerid in statsByPlayer) {
      var stat = statsByPlayer[playerid];
      var startup = 1;
      for (var i = 0; i < stat.length; ++i) {
        if (stat[i][2] == "STARTUP") {
          startup++;
        }
      }

      // le nombre de startup d'anonymous n'a aucun sens
      // le process est le suivant :
      // 1 STARTUP => forcement anonymous
      // 2 STARTUP => forcement non anonymous
      if (playerid === "anonymous")
        continue; 
      var player = playersById[playerid];
      if (player) {
        // RAW STATS.
        console.log(playerid + ': ' + startup + ' startups ( ' + player.name + '/' + player.email.address +' )');
      }
    }
    
    // 
    
    
    process.exit(0);
  } catch (e) { console.log(e) }
  */


