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
    res.send('{}');
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
    res.send('{}');
  });
});

app.get('/v1/report/games/:id/', function (req, res) {
  DB.Model.Game.findById(req.params.id, function (err, game) {
    if (err || !game) {
      reportLogger.info('game,'+req.params.id+',error,'+req.ip);
      app.log('error reporting game '+req.params.id, 'error');
      app.log(err, 'error');
    } else {
      game._reported = true;
      game.save(); // async
      reportLogger.info('game,'+req.params.id+',ok,'+req.ip);
    }
    res.send('{}');
  });
});

app.get('/v1/report/games/:id/stream/:streamid/', function (req, res) {
  DB.Model.Game.findById(req.params.id, function (err, game) {
    if (err || !game) {
      reportLogger.info('streamItem,'+req.params.streamid+',error,'+req.ip);
      app.log('error reporting streamItem '+req.params.streamid + ' in game ' + req.params.id, 'error');
      app.log(err, 'error');
    } else if (!Array.isArray(game.stream)) {
      reportLogger.info('streamItem,'+req.params.streamid+',error,'+req.ip);
      app.log('error reporting streamItem '+req.params.streamid + ' in game ' + req.params.id + ' no stream', 'error');
    } else {
      // searching streamItem
      var i , l = game.stream.length;
      for (i = 0; i < l; ++i)
        if (game.stream[i]._id == req.params.streamid)
          break;
      if (i === l) {
        reportLogger.info('streamItem,'+req.params.streamid+',error,'+req.ip);
        app.log('error reporting streamItem '+req.params.streamid + ' in game ' + req.params.id + ' streamItem not found', 'error');
      } else {
        game.stream[i]._reported = true;
        game.save(); // async
        reportLogger.info('streamItem,'+req.params.streamid+',ok,'+req.ip);
      }
    }
    res.send('{}');
  });
});
