#!/usr/bin/env node

require('../../server/helpers.js');

if (typeof process.argv[2] !== "string" ||
    !process.argv[2].startsWith("/tmp/")) {
  console.log('ERROR: missing arguments /tmp/file.csv');
  console.log(JSON.stringify(process.argv));
  process.exit(1);
}

var file = process.argv[2];

var csv = require('csv')
  , fs = require('fs')
  , DB = require('../../server/db.js')
  , Conf = require('../../server/conf.js')
  , mongoose = require('mongoose');

// mongo connection
mongoose.connection.on('error', function () {
  console.log('mongo: disconnected');
});
mongoose.connection.on('connected', function () {
  console.log('mongo: connected');
  start();
});
mongoose.connect(Conf.get('mongo.url'));
console.log('connecting to '+Conf.get('mongo.url'));

var nb_total = 0;
var nb_duplicates = 0;
var nb_clubs = 0;

function start() {
  var clubs = [];
  var fedids = {};
  
  /*
  * input csv format :
  * 0  name
  * 1  city
  */  
  csv()
  .from.stream(fs.createReadStream(file)) // __dirname+
  .transform(function (row, index) {
    return (index) ? row : null;
  })
  .on('record', function (row) {
    nb_total++;
    // avoiding duplicates
    var fedid = row[0];
    if (typeof fedids[fedid] !== "undefined" || fedid == "")
    {
      nb_duplicates++;
      console.log("duplicate on fedid: "+fedid+" row= "+JSON.stringify(row));
      return;
    }
    fedids[fedid] = true;
    // 
    var club = {
      sport: "badminton",
      name: row[0],
      location: {
        address: "", // zip :/  should be empty ?
        city: row[1],
        zip: "", // should be in location !!!??
        pos: "" // unknown
      },
      fedid: "",
      ligue: "",
      school: ""
    };
    // ensure numbers
    //if (parseInt(row[5], 10))
    //  club.outdoor = parseInt(row[5], 10);
    //if (parseInt(row[6], 10))
    //  club.indoor = parseInt(row[6], 10);
    //if (parseInt(row[7], 10))
    //  club.countPlayers = parseInt(row[7], 10);
    //if (parseInt(row[8], 10))
    //  club.countPlayers1AN = parseInt(row[8], 10);
    //if (parseInt(row[9], 10))
    //  club.countTeams = parseInt(row[9], 10);
    //if (parseInt(row[10], 10))
    // club.countTeams1AN = parseInt(row[10], 10);
	  
    nb_clubs++;
    clubs.push(club);
  })
  .on('end', function(count){
    console.log('saving ' + nb_clubs + ' clubs ... please wait');
    DB.Models.Club.create(clubs, function (err) {
      if (err) {
        console.log('error: ' + err);
        process.exit(1);
      }
      console.log('everything went ok.');
      console.log('stats:');
      console.log(' total input clubs   : ' + nb_total);
      console.log(' total duplicates    : ' + nb_duplicates);
      console.log(' total clubs imported: ' + nb_clubs);
      process.exit(0);
    });
  })
  .on('error', function(error){
    console.log(error.message);
  });
}
