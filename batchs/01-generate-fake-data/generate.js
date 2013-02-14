#!/usr/bin/env node

require('../../server/helpers.js');

var Conf = require('../../server/conf.js')
  , Data = require('./data.js')
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
  Data.generateFakeDataAsync().done(
    function () { process.exit(0) },
    function () { process.exit(1) }
  );
}