var Conf = require("../conf.js")
  , DB = require("../db.js")
  , app = require("../app.js");

if (Conf.env === "DEV") {
  app.get('/documents/games/random', function (req, res) {
    DB.Model.Game.randomAsync().then(
      function success(game) {
        res.end(JSON.stringify(game));
      },
      function error(err) {
        res.end(JSON.stringify({error:err}));
      }
    );
  });

  app.get('/documents/games/:id', function (req, res) {
    var game = DB.searchById(DB.games, req.params.id);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(game));
  });

  app.get('/documents/players/random', function (req, res) {
    DB.Model.Player.randomAsync().then(
      function success(player) {
        res.end(JSON.stringify(player));
      },
      function error(err) {
        res.end(JSON.stringify({error:err}));
      }
    );
  });

  app.get('/documents/players/:id', function (req, res) {
    var player = DB.searchById(DB.players, req.params.id);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(player));
  });

  app.get('/documents/clubs/random', function (req, res) {
    DB.Model.Club.randomAsync().then(
      function success(club) {
        res.end(JSON.stringify(club));
      },
      function error(err) {
        res.end(JSON.stringify({error:err}));
      }
    );
  });

  app.get('/documents/clubs/:id', function (req, res) {
    var club = DB.searchById(DB.clubs, req.params.id);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(club));
  });
};