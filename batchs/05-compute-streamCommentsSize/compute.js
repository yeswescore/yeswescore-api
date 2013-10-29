#!/usr/bin/env node

require('../../server/helpers.js');

var Conf = require('../../server/conf.js')
  , mongoose = require('mongoose')
  , DB = require('../../server/db.js')
  , Q = require('q');

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


function start() {
  console.log('--------------- START ---------------');
  // FIXME: on ne pourra pas toujours lancer ce script
  //  car bien que le script lise avec un stream la data
  //  (et encore, a voir si mongoose utilise vraiment un stream
  //    entre mongo et node)
  //  nous stoquons dans un tableau les elements a recalculer / modifier
  //  cette liste pourrait être potentiellement grande à l'avenir.
  var idToSize = {};
  var stream = DB.Models.Game.find({}).stream();
  stream.on("data", function (game) {
    var cachedCommentsSize = game.streamCommentsSize;
    var realCommentsSize = game.stream.length;
    if (realCommentsSize !== cachedCommentsSize) {
      console.log(
        /*'KO',*/
        game.id,
        cachedCommentsSize,
        realCommentsSize);
      idToSize[game.id] = realCommentsSize;
    }/* else {
      console.log(
        'OK',
        game.id,
        cachedCommentsSize,
        realCommentsSize);
    }*/
  }).on("error", function (err) {
    console.log("error " + err);
  }).on("close", function () {
    console.log('--------------- FINISHED ---------------');
    var promises = Object.keys(idToSize).map(function (id) {
      Q.nfcall(
        DB.Models.Game.findByIdAndUpdate.bind(DB.Models.Game),
        id,
        { $set: { streamCommentsSize: idToSize[id] } }
      );
    });
    Q.all(promises).done(
      function () {
        console.log(Object.keys(idToSize).length + ' replacement done');
        process.exit(0);
      },
      function (e) {
        console.log('error, exiting ' + e);
        process.exit(1);
      }
    );
  });
}
