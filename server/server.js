// simple static server
var app = require("./app.js")
  , express = require("express")
  , Conf = require("./conf.js");
  
// helpers
require('./helpers.js');

// static directory, will be used for tests.
app.use("/static", express.static(__dirname + '/static'));
// default Content-Type
app.use(function (req, res, next) {
  res.type('application/json; charset=utf-8');
  next();
});

app.defaultError = function (res, msg) { 
  return function (err) { res.end(JSON.stringify({error:err, message:msg})); };
};

require('./api/bootstrap.js');
require('./api/clubs.js');
require('./api/documents.js');
require('./api/games.js');
require('./api/players.js');

app.listen(Conf.get('http.port'));
