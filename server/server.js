// helpers
require('./helpers.js');

// simple static server
var app = require('./app.js')
  , express = require('express')
  , mongoose = require('mongoose')
  , Conf = require('./conf.js')
  , DB = require('./db.js');

require('./api/auth.js');
require('./api/bootstrap.js');
require('./api/clubs.js');
require('./api/documents.js');
require('./api/email.js');
require('./api/files.js');
require('./api/games.js');
require('./api/players.js');
require('./api/stats.js');
require('./api/admin.js');
require('./api/report.js');
require('./api/teams.js');

// mongoose parameters
mongoose.connection.on('error', function () { DB.status = 'disconnected' });
mongoose.connection.on('connected', function () { DB.status = 'connected' });
mongoose.connection.once('open', function () {
  // nothing yet.
});
mongoose.connect(Conf.get('mongo.url'));

// bind server
app.listen(Conf.get('http.port'));
