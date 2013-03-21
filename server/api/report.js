var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , winston = require("winston");
  
var reportLogger = winston.loggers.get('report');

app.get('/v1/report/clubs/:id/', function (req, res) {
  DB.Model.Club.findById(req.params.id, function (err, club) {
    if (err || !club) {
      reportLogger.info('club,'+req.params.id+',error,'+req.ip);
      app.log('error reporting club '+req.params.id, 'error');
      app.log(err, 'error');
    } else {
      club._reported = true;
      club.save(); // async
      reportLogger.info('club,'+req.params.id+',ok,'+req.ip);
    }
    res.end('{}');
  });
});

app.get('/v1/report/players/:id/', function (req, res) {
  DB.Model.Player.findById(req.params.id, function (err, player) {
    if (err || !player) {
      reportLogger.info('player,'+req.params.id+',error,'+req.ip);
      app.log('error reporting player '+req.params.id, 'error');
      app.log(err, 'error');
    } else {
      player._reported = true;
      player.save(); // async
      reportLogger.info('player,'+req.params.id+',ok,'+req.ip);
    }
    res.end('{}');
  });
});

app.get('/v1/report/games/:id/', function (req, res) {
  
});

app.get('/v1/report/teams/:id/', function (req, res) {
  res.end("fixme");
});

app.get('/v1/report/streamItem/:id/', function (req, res) {
  
});
