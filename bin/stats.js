var fs = require('fs')
  , exec = require('child_process').exec
  , csv = require('csv');

if (!fs.existsSync('../server/conf.js')) {
  console.log('ERROR: cannot find configuration file');
  process.exit(1);
}

var Conf = require('../server/conf.js')
  , MongoClient = require('mongodb').MongoClient
  , Server = require('mongodb').Server
  , Q = require("q");

console.log('connecting to mongo: ' + Conf.get('mongo.url'));

var result = '';
function msg(m) { result += String(m) + "\n"; };

var mongoClient = new MongoClient(new Server('localhost', 27017));
Q.nfcall(mongoClient.connect.bind(mongoClient), Conf.get('mongo.url'))
 .then(function (db) {
    var collectionPlayers = db.collection("players");
    var collectionClubs = db.collection("clubs");
    var collectionGames = db.collection("games");
    
    var promises = [];
    // total number of players (!owned) in the db.
    promises.push(Q.nfcall(collectionPlayers.count.bind(collectionPlayers), { type: { $ne: "owned" } }));
    // total number of players (!owned) in the db with a name
    promises.push(Q.nfcall(collectionPlayers.count.bind(collectionPlayers), { type: { $ne: "owned" }, "name": { $ne: "" } }));
    // total number of players (!owned) in the db with an email
    promises.push(Q.nfcall(collectionPlayers.count.bind(collectionPlayers), { type: { $ne: "owned" }, "email": { $ne: undefined } }));
    // total number of players (!owned) in the db with a name & an email
    promises.push(Q.nfcall(collectionPlayers.count.bind(collectionPlayers), { type: { $ne: "owned" }, "name": { $ne: "" }, "email": { $ne: undefined } }));
    // total number of games in the db.
    promises.push(Q.nfcall(collectionGames.count.bind(collectionGames), { }));
    // total number of clubs in the db.
    promises.push(Q.nfcall(collectionClubs.count.bind(collectionClubs), { }));
    // total number of comments
    promises.push(Q.nfcall(collectionGames.aggregate.bind(collectionGames),
      [
        {$project:{stream:1}},
        {$unwind:"$stream"}
      ]));
    
    // number of players created during the last week
    promises.push(Q.nfcall(collectionPlayers.count.bind(collectionPlayers), { "dates.creation": { $gt: new Date(Date.now() - 7 * 24 * 3600 * 1000) }, type: { $ne: "owned" } }));
    // number of games created during the last week
    promises.push(Q.nfcall(collectionGames.count.bind(collectionGames), { "dates.creation": { $gt: new Date(Date.now() - 7 * 24 * 3600 * 1000) } }));
    // number of comments created during last week
    promises.push(Q.nfcall(collectionGames.aggregate.bind(collectionGames),
      [
        {$project:{stream:1}},
        {$match:{"stream.dates.creation":{ $gt: new Date(Date.now() - 7 * 24 * 3600 * 1000) }}},
        {$unwind:"$stream"}
      ]));
    
    
    // number of players created at D-1,D-2...D-7
    for (var i = 0; i < 7; i++) {
      promises.push(Q.nfcall(collectionPlayers.count.bind(collectionPlayers), {
        "dates.creation": {
          $gt: new Date(Date.now() - (i + 1) * 24 * 3600 * 1000),
          $lt: new Date(Date.now() - i * 24 * 3600 * 1000)
        },
        type: { $ne: "owned" }
      }));
    }
    // number of games created at D-1,D-2...D-7
    for (var i = 0; i < 7; i++) {
      promises.push(Q.nfcall(collectionGames.count.bind(collectionGames), {
        "dates.creation": {
          $gt: new Date(Date.now() - (i + 1) * 24 * 3600 * 1000),
          $lt: new Date(Date.now() - i * 24 * 3600 * 1000)
        }
      }));
    }
    // number of comments created at D-1,D-2...D-7
    for (var i = 0; i < 7; i++) {
      promises.push(Q.nfcall(collectionGames.aggregate.bind(collectionGames),
        [
          {$project:{stream:1}},
          {$match:{"stream.dates.creation":{ 
            $gt: new Date(Date.now() - (i + 1) * 24 * 3600 * 1000),
            $lt: new Date(Date.now() - i * 24 * 3600 * 1000)
          }}},
          {$unwind:"$stream"}
        ]));
    }
    // launching the requests
    Q.all(promises).then(function (data) {
      // stats players, games, clubs
      msg('Stats mongo: ');
      msg('');
      msg('total nb players = ' + data.shift());
      msg('   with a name   = ' + data.shift());
      msg('   with an email = ' + data.shift());
      msg('   with both     = ' + data.shift());
      msg('total nb games = ' + data.shift());
      msg('total nb clubs = ' + data.shift());
      msg('total comments = ' + data.shift().length);
      // stats temporelles WE
      msg('');
      msg('nb players  dernier WE = ' + data.shift());
      msg('nb games    dernier WE = ' + data.shift());
      msg('nb comments dernier WE = ' + data.shift().length);
      // stats temporelles days
      msg('');
      for (var i = 1; i <= 7; ++i) {
        msg('nb players  D-' + i + ' = ' + data.shift());
      }
      for (var i = 1; i <= 7; ++i) {
        msg('nb games    D-' + i + ' = ' + data.shift());
      }
      for (var i = 1; i <= 7; ++i) {
        msg('nb comments D-' + i + ' = ' + data.shift().length);
      }
      return;
    }).then(function () {
      // csv parsing.
      return Q.nfcall(exec, "tail -10000 " + Conf.get("logs.path") + "stats.log |cut -c 7- > /tmp/_tmpstats.txt");
    }).then(function () {
      var simpleDeferred = Q.defer();
      
      var startup = 0;
      var pages = {};
      var languages = {};
      
      csv()
      .from.stream(fs.createReadStream("/tmp/_tmpstats.txt"))
      .transform(function (row, index) {
        // on ne conserve que les stats qui datent de moins de 24H.
        return (parseInt(row[0], 10) > (Date.now() - 1 * 24 * 3600 * 1000)) ? row : null;
      })
      .on('record', function (row) {
        if (row[2] == "STARTUP") {
          startup++;
        }
        if (row[2] == "PAGE") {
          if (typeof pages[row[4]] === "undefined")
            pages[row[4]] = 0;
          pages[row[4]]++;
        }
        // FIXME stats précises dès que l'on aura les id clients.
      })
      .on('end', function(count){
        msg('');
        msg('Stats client: ');
        msg(startup + ' startup');
        msg('');
        msg('Nb hits / page :');
        Object.keys(pages).forEach(function (page) {
          msg(page + ": " + pages[page]);
        });
        simpleDeferred.resolve();
      })
      .on('error', function(error){
        simpleDeferred.reject();
      });
      return simpleDeferred.promise;
    }).then(
       function () {         
         console.log("success");
         console.log(result);
         db.close();
      },
       function (e) {
         console.log("error:"+e);
         console.log(result);
         db.close();
      }
    );
 }, function () {
   console.log('cannot connect to mongo');
 });

//////////////////
// MONGO STATS
//////////////////

// number of players created in the last 7 days


// number of players created in the last month



//////////////////
// stats log
//////////////////

