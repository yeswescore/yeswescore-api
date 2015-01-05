var mongoose = require('mongoose')
  , Conf = require('../conf.js')
  , Q = require('q')
  , crypto = require('crypto');

var Models = {};

Models.generate = function (DB) {
  var modelNames = ['Club', 'File', 'Game', 'Player', 'Team'];
  modelNames.forEach(function (modelName) {
    var model = Models[modelName];
    // schema => model
    model = mongoose.model(modelName, DB.Schemas[modelName]);
    // generic static funcs.
    model.exist = DB.exist(model);
    model.existOrEmpty = DB.existOrEmpty(model);
    if (Conf.env === "DEV")
      model.getRandomModel = function () { return DB.getRandomModel(model) };
  });
  Models.Club = mongoose.model("Club", DB.Schemas.Club);
  Models.Player = mongoose.model("Player", DB.Schemas.Player);
  Models.Game = mongoose.model("Game", DB.Schemas.Game);
  Models.File = mongoose.model("File", DB.Schemas.File);
  Models.Team = mongoose.model("Team", DB.Schemas.Team);

  //
  // Methods
  //
  Models.Player.isEmailRegisteredAsync = function (email) {
    return Q.nfcall(
      DB.Models.Player.findOne.bind(DB.Models.Player),
      {
        "email.address": email,
        $or: [
          { "email.status": "confirmed" },
          {
            "email.status": "pending-confirmation",
            "email._dates._created": { $gt: Date.now() - 3600 * 1000 }
          }
        ]
      }
    );
  };

  Models.Player.createEmailToken = function () {
    var shasum = crypto.createHash('sha256');
    shasum.update(Math.random()+' w00t '+Math.random());
    return shasum.digest('hex');
  };

  // FIXME: use definition to automate theses tests.
  Models.Game.checkFields = function (game) {
    if (game.sport && game.sport !== "tennis"
        && game.sport !== "tabletennis" && game.sport !== "squash" && game.sport !== "speedbadminton" 
        && game.sport !== "badminton" && game.sport !== "padel" && game.sport !== "racquetball"
    )
      return "wrong sport (tennis, tabletennis, squash, badminton, speedbadmiton, racquetball only)";
    // check type
    if (game.type && game.type !== "singles")
      return "wrong type (singles only)";
    // check status
    if (game.status &&
        game.status !== "created" && game.status !== "ongoing" &&
        game.status !== "finished" && game.status !== "canceled" &&
        game.status !== "aborted"
        )
      return "wrong status (created/ongoing/finished/canceled/aborted)";
    // check teams
    if (game.teams) {
      if (!Array.isArray(game.teams) || game.teams.length !== 2)
        return "teams format";
      // check teams.players
      var ok = game.teams.every(function (team) {
        return Array.isArray(team.players) &&
              team.players.every(function (player) {
                return typeof player === "string" ||
                      typeof player === "object"; // FIXME: should be more strict ..
              });
      });
      if (!ok)
        return "teams.players format";
    }
    if (game.infos && game.infos.court &&
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
        "A", "B", "C", "D", "E", "F", "" ].indexOf(game.infos.court) === -1)
      return "wrong court (1-11, A-F or empty)";
    if (game.infos && game.infos.subtype &&
        [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ].indexOf(game.infos.subtype) === -1)
      return "wrong subtype (A-F)";
    if (game.infos && game.infos.surface &&
        ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ",
        "NVTB", "PAR", "RES", "TB", "" ].indexOf(game.infos.surface) === -1)
      return "wrong surface (BP,EP,EPDM,GAS,GAZ,MOQ,NVTB,PAR,RES,TB or empty";

    if (game.infos && game.infos.official &&
        (typeof game.infos.official !== "boolean" && game.infos.official !== "true" && game.infos.official !== "false") )
      return "wrong official ( true or false only )";

    if (game.infos && game.infos.pro &&
       (typeof game.infos.pro !== "boolean" && game.infos.pro !== "true" && game.infos.pro !== "false") )
      return "wrong pro ( true or false only )";

    if (game.infos && game.infos.numberOfBestSets &&
        (parseInt(game.infos.numberOfBestSets, 10) < 0 || parseInt(game.infos.numberOfBestSets, 10) > 10))
      return "numberOfBestSets should be numeric";
      
    if (game.infos && game.infos.maxiSets &&
        (parseInt(game.infos.maxiSets, 10) < 0 || parseInt(game.infos.maxiSets, 10) > 10))
      return "maxiSets should be numeric";      

    return null;
  };


  /**
  * FIXME: documentation
  * @return promise , callback val = game
  */
  Models.Game.updateTeamsAsync = function (game, teams) {
    // updatable teams.points
    if (!Array.isArray(teams))
      return Q.resolve(game);
    teams.forEach(function (team, teamIndex) {
      if (typeof team.points === "string")
        game.teams[teamIndex].points = team.points;
    });
    // update teams.players
    return DB.Models.Game.updateTeamsPlayersAsync(game, teams);
  };

  /**
  * FIXME: documentation
  * @return promise , callback val = game
  */
  Models.Game.updateTeamsPlayersAsync = function (game, teams) {
    if (!Array.isArray(teams))
      return Q.resolve(game); // nothing to do.
    return DB.Models.Game.checkTeamsAsync(teams).then(function () {
      // teams exist => create owned players
      return DB.Models.Game.createOwnedPlayersAsync(teams, game.owner)
    }).then(function () {
      // update game teams players
      teams.forEach(function (team, teamIndex) {
        team.players.forEach(function (player, playerIndex) {
          var playerid = DB.toStringId(player);
          var oldPlayerId = DB.toStringId(game.teams[teamIndex].players[playerIndex]);
          if (DB.Id.neq(playerid, oldPlayerId))
            game.markModified('teams');
          game.teams[teamIndex].players[playerIndex] = DB.toObjectId(playerid);
        });
      });
      return game;
    });
  };

  // additionnals functions
  Models.Game.checkTeamsAsync = function (teams) {
    var playersId = teams.reduce(function (p, team) {
      return p.concat(
        team.players.map(DB.toStringId)
                    .filter(function (id) { return id !== null }));
    }, []);
    return DB.exist(DB.Models.Player, playersId)
            .then(function (exist) {
                if (!exist)
                  throw "some player doesn't exist";
              });
  };

  // replace game.teams.players object by created players ids
  Models.Game.createOwnedPlayersAsync = function (teams, owner) {
    var promises = [];
    for (var teamIndex = 0; teamIndex < teams.length; ++teamIndex) {
      var team = teams[teamIndex];
      var players = team.players;
      for (var playerIndex = 0; playerIndex < players.length; ++playerIndex) {
        var player = players[playerIndex];
        if (typeof player !== "string" &&
            typeof player.id !== "string") {
          //
          // [FIXME] refactor this with POST /v2/players/
          //
          // creating owned anonymous player
          (function createOwnedAnonymousPlayer(teamIndex, playerIndex) {
            var p = new DB.Models.Player({
              name: player.name || "",
              rank: player.rank || "",
              type: "owned",
              owner: owner
            });
            // we need to handle the club
            var deferred = Q.defer();
            var ownedPlayerPromise = deferred.promise;
            if (player.club && player.club.id) {
              DB.Models.Club.findById(player.club.id, function (err, club) {
                deferred.resolve(club); // never fail !
              });
            } else {
              deferred.resolve(null);
            }
            promises.push(
              ownedPlayerPromise.then(function (club) {
                if (club) {
                  p.club.id = club.id;
                  p.club.name = club.name;
                }
                return DB.save(p)
                        .then(function (p) {
                            teams[teamIndex].players[playerIndex] = p.id;
                      });
              })
            );
          })(teamIndex, playerIndex);
        }
      }
    }
    return Q.all(promises);
  };

  // 51e8fd31cba93e9f5d-000023 => 51/e8/fd/31/51e8fd31cba93e9f5d-000023
  Models.File.idTypeToPathInfos = function (id, type) {
    // we will need a switch here (type)
    var ext = ".jpeg";
    var directory = id.substr(0, 10).match(/.{1,2}/g).join("/");
    var filename = id + ext;
    var path = directory + "/" + filename;
    return {
      directory: directory,
      filename: filename,
      path: path
    }
  };

  Models.File.checksum = function (buffer) {
    return crypto.createHash('sha256')
                .update(buffer)
                .digest('hex');
  };

  Models.Team.getOwnersIds = function (obj) {
    var ownersIds = [];
    if (!obj) return [];
    if (Array.isArray(obj.players) && obj.players.length)
      ownersIds = ownersIds.concat(obj.players.map(DB.toStringId));
    if (Array.isArray(obj.substitutes) && obj.substitutes.length)
      ownersIds = ownersIds.concat(obj.substitutes.map(DB.toStringId));
    if (obj.captain)
      ownersIds.push(obj.captain);
    if (obj.captainSubstitute)
      ownersIds.push(obj.captainSubstitute);
    if (obj.coach)
      ownersIds.push(obj.coach);
    return ownersIds;
  };

  // FIXME: empty
  Models.Team.checkFields = function () { return Q.fcall(function () { }); };
};

module.exports = Models;
