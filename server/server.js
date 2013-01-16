// simple static server
var app = require("./app.js")
  , express = require("express")
  , Conf = require("./conf.js");
  
// helpers
require('./helpers.js');

// static directory, will be used for tests.
app.use("/static", express.static(__dirname + '/static'));

require('./api/bootstrap.js');
require('./api/clubs.js');
require('./api/documents.js');
require('./api/games.js');
require('./api/players.js');
require('./api/admin.js');

app.listen(Conf.get('http.port'));
