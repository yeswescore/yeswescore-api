// simple static server
var app = require("./app.js")
  , express = require("express")
  , Conf = require("./conf.js");
  
// helpers
require('./helpers.js');

// default Content-Type
app.use(function (req, res, next) {
  res.type('application/json; charset=utf-8');
  next();
});

require('./api/auth.js');
require('./api/bootstrap.js');
require('./api/clubs.js');
require('./api/documents.js');
require('./api/games.js');
require('./api/players.js');
require('./api/admin.js');

app.listen(Conf.get('http.port'));
