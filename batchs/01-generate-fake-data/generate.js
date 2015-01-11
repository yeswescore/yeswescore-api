#!/usr/bin/env node

require('../../server/helpers.js');

var Conf = require('../../server/conf.js')
  , DataBadminton = require('./data-badminton.js')
  , DataPadel = require('./data-padel.js')
  , DataRacquetball = require('./data-racquetball.js')
  , DataSpeedbadminton = require('./data-speedbadminton.js')
  , DataSquash = require('./data-squash.js')
  , DataTabletennis = require('./data-tabletennis.js')
  , DataTennis = require('./data-tennis.js')  
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

function start() {

  var Q = require('q');

  Q.all( [ DataTennis.generateFakeDataAsync()
			//, DataPadel.generateFakeDataAsync()
			//, DataRacquetball.generateFakeDataAsync()
			, DataSpeedbadminton.generateFakeDataAsync()
			//, DataSquash.generateFakeDataAsync()
			//, DataTabletennis.generateFakeDataAsync()
			//, DataBadminton.generateFakeDataAsync()
	] )
  .done(
    function () { process.exit(0) },
    function () { process.exit(1) }
  );
}