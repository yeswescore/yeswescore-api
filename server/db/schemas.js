var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Conf = require('../conf.js')
  , crypto = require('crypto');
  
var Schemas = {
  Club: null,
  File: null,
  Game: null,
  Player: null,
  StreamItem: null,
  Team : null
};

// Hidden fields
var hiddenFields = ["password", "token"];
var deletePrivatesRec = function (o) {
  Object.keys(o).forEach(function (key) {
    if (key[0] === "_") delete o[key];
    if (typeof o[key] === "object" && o[key])
      deletePrivatesRec(o[key]);
  });
};

Schemas.generate = function (DB) {
  // creation order: nested schemas to outer schemas.
  var schemaNames = ["StreamItem", "Team", "Club", "Player", "Game", "File"/*, "Competition"*/];
  schemaNames.forEach(function (name) {
    // generating definition
    DB.Definitions["generate"+name](DB);
    // create schema from definition
    Schemas[name] = new Schema(DB.Definitions[name]);
    // Adding defautl transform func
    Schemas[name].options.toObject = {
      transform : function (doc, ret, options) {
        var hide = hiddenFields;
        if (options.unhide) {
          hide = hide.slice(); // clone
          options.unhide.forEach(function (field) { hide.remove(field) });
        }
        // removing private fields
        //    /!\ performance hit :( !!
        deletePrivatesRec(ret);
        // removing hidden fields
        hide.forEach(function (prop) { delete ret[prop] });
      }
    };
  });
  
  //
  // VIRTUALS
  //
  
  Schemas.Player.virtual('uncryptedPassword').set(function (uncryptedPassword) {
    var shasum = crypto.createHash('sha256');
    // android bug with swipe: we do not want any [space] chars.
    shasum.update(uncryptedPassword.replace(/ /g, '')+Conf.get("security.secret"));
    this.password = shasum.digest('hex');
  });

  Schemas.Player.virtual('languageSafe').set(function (languageUnsafe) {
    // filtering languages to enter enum
    // @see http://tools.ietf.org/html/rfc4646
    // ex: en-US => en
      var language = languageUnsafe.split('-')[0];
      var languages = Schemas.Player.path('language').enumValues;
      if (languages.indexOf(language) === -1)
        language = Conf.get("default.language");
      this.language = language;
  });

  //
  // AUTO FIELDS
  //
  Schemas.Club.pre('save', function (next) {
    if (this.isModified('name'))
      this._searchableName = this.name.searchable();
    next();
  });

  /*
  * Before saving a player we might need to
  *  - update searchableName
  *  - update searchableClubName
  */
  Schemas.Player.pre('save', function (next) {
    if (this.isModified("games") && this.games.length !== 0)
      throw "should not save games "+JSON.stringify(this);
    // infos for post save
    this._wasModified = [];
    // player._searchableName
    if (this.isModified('name')) {
      this._wasModified.push('name');
      this._searchableName = this.name.searchable();
    }
    // player._searchableClubName
    // player.club.name
    var self = this;
    if (this.isModified('club')) {
      this._wasModified.push('club');
      if (this.club && typeof this.club.id !== "undefined") { // WTF.. on this test.
        // club has been added / modified
        DB.Models.Club.findById(this.club.id, function (err, club) {
          if (err) {
            app.log('player pre save; error ' + err, 'error');
            return next(); // FIXME: log.
          }
          self.club.name = club.name;
          self._searchableClubName = club.name.searchable();
          next();
        });
      } else {
        next(); // club has been removed. => nothing.
      }
    } else {
      next();
    }
  });

  /*
  * After saving a player we might need to
  *  - update Game searchableName
  *  - update Game searchableClubName
  *  - update Game searchableClubId
  */
  Schemas.Player.post('save', function () {
    // SUPER HEAVY PLAYER GAMES UPDATE
    // SHOULD BE DISPATCHED TO A WORKER, ASYNC STUFF.
    if (this._wasModified.indexOf("name") === -1 &&
        this._wasModified.indexOf("club") === -1)
      return;

    var wasModified = this._wasModified; // is garbage collected by mongoose ?

    // ASYNC STUFF HERE
    // maybe we should use player.games
    DB.Models.Game.find({"teams.players": this.id})
                  .select("teams")
                  .populate("teams.players")
                  .exec(function (err, games) {
      if (err) {
        app.log('player post save error ' + err, 'error');
        return;
      }
      // for
      games.forEach(function postSaveUpdateForEachGame(game) {
        if (wasModified.indexOf("name") !== -1) {
          game._searchablePlayersNames = game.teams.reduce(function (p, team) {
            return p.concat(team.players.map(function (player) {
              return player.name.searchable();
            }));
          }, []);
        }
        //
        if (wasModified.indexOf("club") !== -1) {
          game._searchablePlayersClubsIds = game.teams.reduce(function (p, team) {
            return p.concat(team.players.filter(function (player) {
              return player.club && player.club.id;
            }).map(function (player) {
              return player.club.id;
            }));
          }, []);

          game._searchablePlayersClubsNames = game.teams.reduce(function (p, team) {
            return p.concat(team.players.filter(function (player) {
              return player.club && player.club.name;
            }).map(function (player) {
              return player.club.name.searchable();
            }));
          }, []);
        }
        // When ? we don't know & we don't mind *yet* :)
        game.save();
      }, this);
    });
  });

  /*
  * Before saving a game we might need to
  *  - update searchableName
  *  - update searchableClubName
  *  - update searchableClubIds
  *
  * FIXME: performance: need to read teams.players ?
  *
  */
  Schemas.Game.pre('save', function (next) {
    // infos for post save
    this._wasModified = [];
    // game._searchableCity
    if (this.isModified('location.city'))
      this._searchableCity = this.location.city.searchable();
    // game._teams
    if (this.isModified('teams')) {
      this._wasModified.push('teams');
      // we need first to read the players from DB, to get the old "players"
      //  and be able to "remove" potentially added players
      DB.Models.Game.findById(this.id)
                  .select("teams.players")
                  .exec(function (err, oldGame) {
        if (err)
          return next(); // FIXME: we should log this error.
        // reading players from DB.
        this._newPlayersIds = this.teams.reduce(function (p, team) {
          return p.concat(team.players);
        }, []);
        if (oldGame) {
          this._oldPlayersIds = oldGame.teams.reduce(function (p, team) {
            return p.concat(team.players);
          }, []);
        } else {
          this._oldPlayersIds = []; // might be no old game (creation).
        }
        // players should exist in db
        DB.Models.Player.find({_id: { $in: this._newPlayersIds } }, function (err, players) {
          if (err)
            return next(); // FIXME: we should log this error.
          if (!players)
            return next(); // FIXME: we should log this error.
          this._searchablePlayersNames = players.map(function (p) { return p.name.searchable() });
          this._searchablePlayersClubsIds = players.filter(function (p) { return p.club && p.club.id })
                                                  .map(function (p) { return p.club.id });
          this._searchablePlayersClubsNames = players.filter(function (p) { return p.club && p.club.name })
                                                    .map(function (p) { return p.club.name.searchable() });
          next();
        }.bind(this));
      }.bind(this));
    } else {
      next();
    }
  });

  /*
  * After saving a game we might need to
  *  - update Player games
  *
  * FIXME: update Player.games sync or async ?
  */
  Schemas.Game.post('save', function () {
    if (this._wasModified.indexOf('teams') === -1)
      return;

    // teams were modified, we need to update players.games
    var removedPlayersFilter =
      this._oldPlayersIds.exclude(this._newPlayersIds)
                        .map(function (oldPlayerId) {
        return { _id: oldPlayerId };
      });
    var addedPlayersFilter =
      this._newPlayersIds.exclude(this._oldPlayersIds)
                        .map(function (newPlayerId) {
        return { _id: newPlayerId };
      });
    // should we do unique ? or should we let do player A vs player A ?
    if (removedPlayersFilter.length) {
      DB.Models.Player.update(
        { $or: removedPlayersFilter }, // search filter
        { $pull: { "games" : this.id } },
        { multi: true },
        function (err) { /* FIXME: nothing yet, but should test&log err */  }
      );
    }
    if (addedPlayersFilter.length) {
      DB.Models.Player.update(
        { $or: addedPlayersFilter }, // search filter
        { $addToSet: { "games" : this.id } },
        { multi: true },
        function (err) { /* FIXME: nothing yet, but should test&log err */  }
      );
    }
  });

  Schemas.Team.pre('save', function (next) {
    if (this.isModified('name'))
      this._searchableName = this.name.searchable();
    if (this.isModified('players') ||
        this.isModified('substitutes') ||
        this.isModified('captain') ||
        this.isModified('captainSubstitute') ||
        this.isModified('coach')) {
      // updating owners
      this._owners = DB.Models.Team.getOwnersIds(this);
    }
    next();
  });

  //
  // Methods
  //
  Schemas.Game.methods.isPlayerWinning = function (player) {
    var playerId = DB.toStringId(player);
    var winningTeamIndexes = this.getWinningTeamIndexes();
    if (!winningTeamIndexes.length)
      return false;
    var everyPlayerOfWinningTeamIsDifferentFromInputPlayer =
      winningTeamIndexes.every(function (winningTeamIndex) {
        return this.teams[winningTeamIndex].players
                  .map(function (p) { return DB.toStringId(p) })
                  .every(function (id) { return !DB.Id.eq(id, playerId) });
      }, this);
    return ! everyPlayerOfWinningTeamIsDifferentFromInputPlayer;
  };

  Schemas.Game.methods.isTeamWinning = function (teamId) {
    var winningTeamIndexes = this.getWinningTeamIndexes();
    if (!winningTeamIndexes.length)
      return false;
    var everyTeamOfWinningTeamIsDifferentFromInputTeam =
      winningTeamIndexes.every(function (winningTeamIndex) {
        return DB.Id.neq(this.teams[winningTeamIndex].id, teamId);
      }, this);
    return ! everyTeamOfWinningTeamIsDifferentFromInputTeam;
  };

  // @return [indexes]  []<=>error, [0], [1] => 1 winner, [0,1] => draw.
  Schemas.Game.methods.getWinningTeamIndexes = function () {
    if (!this.infos)
      return [];
    if (typeof this.infos.score !== "string")
      return [];
    var scoreDetails = this.infos.score.split("/");
    if (scoreDetails.length !== 2)
      return [];
    var scoreTeamA = parseInt(scoreDetails[0], 10);
    var scoreTeamB = parseInt(scoreDetails[1], 10)
    if (scoreTeamA == NaN || scoreTeamB == NaN)
      return [];
    if (scoreTeamA == scoreTeamB)
      return [0, 1]; // draw
    if (scoreTeamA < scoreTeamB)
      return [1]; // team B is winning
    return [0]; // team A is winning
  };


  Schemas.Game.methods.isFinished = function () {
    if (!this.infos)
        return false;
    if (typeof this.infos.score !== "string")
        return false;
    var scoreDetails = this.infos.score.split("/");
    if (scoreDetails.length !== 2)
        return false;
    var scoreTeamA = parseInt(scoreDetails[0], 10);
    var scoreTeamB = parseInt(scoreDetails[1], 10)
    if (scoreTeamA == NaN || scoreTeamB == NaN)
        return false;
    var nbSets = scoreTeamA  + scoreTeamB;
    if (scoreTeamA >= this.infos.numberOfBestSets)
        return true;
    else
        return false;
  };

};

module.exports = Schemas;
