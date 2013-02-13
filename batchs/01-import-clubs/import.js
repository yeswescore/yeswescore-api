#!/usr/bin/env node

require('../../server/helpers.js');

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

function start() {
  var clubs = [];
  
  /*
  * input csv format :
  * 0  fedid
  * 1  name
  * 2  ligue
  * 3  zip
  * 4  city
  * 5  outdoor
  * 6  indoor
  * 7  countPlayers
  * 8  countPlayers1AN
  * 9  countTeams
  * 10 countTeams1AN
  * 11 school
  */  
  csv()
  .from.stream(fs.createReadStream(__dirname+'/clubs.csv'))
  .transform(function (row, index) {
    return (index) ? row : null;
  })
  .on('record', function (row) {
    var club = {
      sport: "tennis",
      name: row[1],
      location: {
        address: "", // zip :/  should be empty ?
        city: row[4],
        zip: row[3], // should be in location !!!??
        pos: [] // unknown
      },
      fedid: row[0],
      ligue: row[2],
      outdoor: row[5],
      indoor: row[6],
      countPlayers: row[7],
      countPlayers1AN: row[8],
      countTeams: row[9],
      countTeams1AN: row[10],
      school: row[11]
    };
    clubs.push(club);
  })
  .on('end', function(count){
    console.log('saving... please wait');
    DB.Model.Club.create(clubs, function (err) {
      if (err)
        console.log('error: ' + err);
      console.log('DONE');
    });
  })
  .on('error', function(error){
    console.log(error.message);
  });
}
