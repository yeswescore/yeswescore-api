var Conf = require("../conf.js")
  , DB = require("../db.js")
  , app = require("../app.js");

if (Conf.env === "DEV") {
  app.get('/documents/games/random', function (req, res) {
    DB.Model.Game.randomAsync().then(
      function success(game) {
        res.send(JSON.stringify(game));
      },
      app.defaultError(res)
    );
  });

  app.get('/documents/games/:id', function (req, res) {
    DB.Model.Game.findOne({_id:req.params.id})
                 .exec(function (err, game) {
      if (err)
        return app.defaultError(res)(err);
      if (game === null)
        return app.defaultError(res)("no game found");
      res.send(JSON.stringify(game));
    });
  });

  app.get('/documents/players/random', function (req, res) {
    DB.Model.Player.randomAsync().then(
      function success(player) {
        res.send(JSON.stringify(player));
      },
      app.defaultError(res)
    );
  });

  app.get('/documents/players/:id', function (req, res) {
    DB.Model.Player.findOne({_id:req.params.id})
                   .exec(function (err, player) {
      if (err)
        return app.defaultError(res)(err);
      if (player === null)
        return app.defaultError(res)("no player found");
      res.send(JSON.stringify(player));
    });
  });

  app.get('/documents/clubs/random', function (req, res) {
    DB.Model.Club.randomAsync().then(
      function success(club) {
        res.send(JSON.stringify(club));
      },
      app.defaultError(res)
    );
  });

  app.get('/documents/clubs/:id', function (req, res) {
    DB.Model.Club.findOne({_id:req.params.id})
                 .exec(function (err, club) {
      if (err)
        return app.defaultError(res)(err);
      if (club === null)
        return app.defaultError(res)("no club found");
      res.send(JSON.stringify(club));
    });
  });
};