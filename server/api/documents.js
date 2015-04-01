var Conf = require("../conf.js")
  , express = require("express")
  , DB = require("../db.js")
  , Q = require("q")
  , mongoose = require("mongoose")
  , Authentication = require("../authentication.js")
  , app = require("../app.js");




/**
 * Read All Players
 *
 */
app.get('/v2/admin/players/', function(req, res){
    var limit = req.query.limit || 10;
    var offset = req.query.offset || 0;
    var club = req.query.club;
    var fields = req.query.fields || "_deleted,sport,following,idlicense,language,name,type,rank,type,games,dates.creation,location.currentPos,id,gender,dates.birth,push.platform,club.id,club.name,email.address,token,profile";
    var longitude = req.query.longitude;
    var latitude = req.query.latitude;
    var distance = req.query.distance;
    var text = req.query.q;
    var sport = req.query.sport || "tennis";
    var sort = req.query.sort || "name";

    var query = DB.Models.Player.find()
    if (fields)
        query.select(fields.replace(/,/g, " "))

    if (club)
        query.where("club.id", club);
    if (sport)
        query.where('sport', sport);
    if (text) {
        text = new RegExp("("+text.searchable().pregQuote()+")");
        query.where("_searchableName", text);
    }
    query.where("type", "default");
    query
        .sort(sort.replace(/,/g, " "))
        .skip(offset)
        .limit(limit)
        .exec(function (err, players) {
            if (err)
                return app.defaultError(res)(err);
            res.send(JSON.stringify(players));
        });
});

/**
 * Create a new player
 *
 */
app.post('/v2/admin/players/', express.bodyParser(), function(req, res){
    if (req.body.type &&
        DB.Definition.Player.type.enum.indexOf(req.body.type) === -1)
        return app.defaultError(res)("unknown type");

    // preprocessing req.body.
    if (req.body.email && typeof req.body.email === "string")
        req.body.email = req.body.email.toLowerCase();

    app.log("email",req.body.email);
    app.log("language",req.body.language);

    var emailConfirmationRequired = false;

    Q.fcall(function () {
        if (req.body.email && typeof req.body.email === "string")
            return DB.Models.Player.isEmailRegisteredAsync(req.body.email);
        return null;
    }).then(function (emailRegistered) {
            if (emailRegistered)
                throw "email already registered";
        }).then(function () {
            var club = req.body.club;
            if (club && club.id)
                return Q.nfcall(DB.Models.Club.findById.bind(DB.Models.Club), club.id);
            return null;
        }).then(function (club) {
            // creating a new player
            var player = new DB.Models.Player({
                name: req.body.name || "",
                sport: "tennis",
                location : {
                    currentPos: req.body.location.currentPos || [],
                    city: req.body.location.city || "",
                    address: req.body.location.address || "",
                    zip: req.body.location.zip || ""
                },
                email : {
                    address: "",
                    status: "pending-confirmation",
                    _token: "",
                    _dates: {
                        _created: ""
                    }
                },
                rank: req.body.rank || "",
                idlicense: req.body.idlicense || "",
                type: req.body.type || "default"
            });
            //sport
            app.log(req.body.sport);
            app.log(typeof req.body.sport);

            if (typeof req.body.sport !== "object")
                player.sport = req.body.sport[0];

            // club
            if (club)
                player.club = { id: club.id, name: club.name };
            // language
            player.languageSafe = req.body.language || Conf.get("default.language");
            //birth
            if (req.body.dates && typeof req.body.dates.birth === "string") {
                player.dates.birth = req.body.dates.birth;
            }
            //gender
            if (req.body.gender && typeof req.body.gender === "string") {
                player.gender = req.body.gender;
            }
            // email
            if (req.body.email && typeof req.body.email === "string") {
                // registering email.
                // might be race condition between check & set. but will be catch by the index.
                player.email.address = req.body.email;
                player.email.status = "pending-confirmation";
                player.email._token = DB.Models.Player.createEmailToken();
                player.email._dates._created = Date.now();
                // sending token by email.
                emailConfirmationRequired = true;
            }
            // password
            if (req.body.uncryptedPassword)
                player.uncryptedPassword = req.body.uncryptedPassword;
            return DB.save(player);
        }).then(function (player) {
            // everything went ok => sending email confirmation
            if (emailConfirmationRequired)
                Email.sendEmailConfirmation(player.email.address, player.email._token, player.language);
            res.send(JSON.stringifyModels(player, { unhide: [ "token" ] }));
        }, app.defaultError(res));
});


/**
 * update a player
 *
 * You must be authentified (?playerid=...&token=...)
 *
 * Body {
 *   name: String,     (default=undefined)
 *   rank: String,     (default=undefined)
 *   email: {
 *     address: String,  (default=undefined)
 *   },
 *   language: String    (default=undefined)
 *   idlicense: String   (default=undefined)
 *   club: { id:..., name:... }  (default=undefined, name: is ignored)
 *   password: String  (default=undefined)
 * }
 */
app.post('/v2/admin/players/:id', express.bodyParser(), function(req, res){

    Authentication.Query.getAdmin(req.query)
        .then(function searchGame(authentifiedPlayer) {

            if (authentifiedPlayer === null)
                throw "unauthorized";
            return Q.ninvoke(DB.Models.Player, 'findById', req.params.id);

        }).then(function updatePlayer(player) {

            app.log('on recup le player',player);

            if (req.body.name) {
                app.log(req.body.name);
                player.name = req.body.name;
            }

            if (req.body.rank) {
                player.rank = req.body.rank;
            }

            if (req.body.gender) {
                player.gender = req.body.gender;
            }

            app.log(req.body.sport);
            app.log(typeof req.body.sport);
            if (typeof req.body.sport === "object")
                player.sport = req.body.sport[0];

            if (req.body.language) {
                player.language = req.body.language;
            }

            if (req.body.email) {
                app.log(req.body.email);
                player.email = {};
                player.email.address = req.body.email;
            }
            else
                app.log('pas email');

            // password
            if (req.body.uncryptedPassword)
                player.uncryptedPassword = req.body.uncryptedPassword;

            player.dates.update = Date.now();
            // saving player
            return DB.save(player);
        })
        .then(function sendPlayer(player) {

            app.internalRedirect('/v2/players/:id')(
                {
                    query: { },
                    params: { id: player.id }
                },
                res);

        }, app.defaultError(res));
});

/**
 * Read a player
 *
 * Authentication provide password & token
 *
 * Generic options:
 *  /v2/players/:id/?fields=name
 *
 * Specific options:
 */
app.get('/v2/admin/players/:id', function(req, res){

    if (typeof req.params.id !== "string")
        return app.defaultError(res)("missing id");

    Authentication.Query.getAdmin(req.query)
        .then(function (authentifiedPlayer) {

            if (authentifiedPlayer === null)
                throw "unauthorized";

            DB.Models.Player.findOne({_id:req.params.id})
                .exec(function (err, player) {
                    if (err)
                        return app.defaultError(res)(err);
                    if (player === null)
                        return app.defaultError(res)("no player found");
                    res.send(JSON.stringifyModels(player));
                });

        },
        app.defaultError(res, "authentication error"));
});

/**
 * Delete a player
 *
 * You must be authentified (?playerid=...&token=...)
 *  &_method=delete
 *
 * Body {
 *   id: String,     (default=undefined)
 * }
 */
app.delete('/v2/admin/players/:id/', express.bodyParser(), function(req, res) {
    // fixme, this code should be shared with previous function.
    if (typeof req.params.id !== "string")
        return app.defaultError(res)("missing id");

    app.log(req.params.id);

    Authentication.Query.getAdmin(req.query)
        .then(function search(authentifiedPlayer) {
            if (authentifiedPlayer === null)
                throw "unauthorized";
            return Q.nfcall(DB.Models.Player.findById.bind(DB.Models.Player),req.params.id);

        }
        ).then(function (player) {

            app.log(player.id);

            return Q.nfcall(DB.Models.Player.update.bind(DB.Models.Player),
                { _id: player.id },
                { $set: { "_deleted" : true }}
            );

        }).then(function () {
            res.send('{}');
        }, app.defaultError(res));

});

/**
 * Read a game
 *
 * Generic options:
 *  /v2/games/:id/?fields=name         (default: please check in the code)
 *
 * Specific options:
 *  /v2/games/:id/?populate=teams.players
 */
app.get('/v2/admin/games/:id', function (req, res){

    var fields = req.query.fields ||
        "sport,status,owner,dates.creation,dates.start,dates.update,dates.end,dates.expected,"+
            "location.country,location.city,location.pos,"+
            "teams,teams.players.name,teams.players.club,teams.players.rank,teams.players.owner,"+
            "infos.type,infos.subtype,infos.sets,infos.score,infos.court,infos.surface,infos.tour,infos.startTeam,infos.official,infos.pro,infos.numberOfBestSets,infos.maxiSets,"+
            "infos.winners,infos.winners.teams,infos.winners.players,infos.winners.status,"+
            "streamCommentsSize,streamImagesSize";
    // populate option
    var populate = "teams.players";
    if (typeof req.query.populate !== "undefined")
        populate = req.query.populate;
    var populatePaths = (typeof populate === "string") ? populate.split(",") : [];
    // preprocess fields
    var fields = app.createPopulateFields(fields, populate);
    // searching player by id.
    var query = DB.Models.Game.findOne({_id:req.params.id, _deleted: false}, fields.select);
    if (populatePaths.indexOf("teams.players") !== -1) {
        query.populate("teams.players", fields["teams.players"]);
    }
    query.exec(function (err, game) {
        if (err)
            return app.defaultError(res)(err);
        if (game === null)
            return app.defaultError(res)("no game found");
        // should we hide the owner ?
        res.send(JSON.stringifyModels(game));
    });

});


/*
 * Update a game
 *
 * result is a redirect to /v2/games/:newid
 */
app.post('/v2/admin/games/:id', express.bodyParser(), function(req, res){

    Authentication.Query.getAdmin(req.query)
        .then(function searchGame(authentifiedPlayer) {
            if (authentifiedPlayer === null)
                throw "unauthorized";

            var query = DB.Models.Game.findOne({_id:req.params.id, _deleted:false});
            return Q.nfcall(query.exec.bind(query));
        }).then(function checkGameOwner(game) {
            if (game === null)
                throw "no game found";
            return game;
        }).then(function updateFields(game) {

            if (typeof req.body.court === "string")
                game.infos.court = req.body.court;

            if (typeof req.body.status === "object")
                game.status = req.body.status[0];

            if (typeof req.body.surface === "string")
                game.infos.surface = req.body.surface;

            if (typeof req.body.city === "string")
                game.location.city = req.body.city;

            if (typeof req.body.official === "boolean") {
                    game.infos.official = req.body.official;
            }

            if (typeof req.body.pro === "boolean") {
                    game.infos.pro = req.body.pro;
            }
            // auto update
            game.dates.update = Date.now();

            return DB.save(game);

        }).then(function sendGame(game) {

            app.internalRedirect('/v2/games/:id')(
                {
                    query: { },
                    params: { id: game.id }
                },
                res);

        }, app.defaultError(res));
});

/*
 * Delete a game
 *
 * You must be authentified
 *
 * /v2/games/:id/?_method=delete
 *
 * FIXME: remove from player games.
 */
app.delete('/v2/admin/games/:id/', function (req, res) {

    if (typeof req.params.id !== "string")
        return app.defaultError(res)("missing id");

    Authentication.Query.getAdmin(req.query)
        .then(function searchGame(authentifiedPlayer) {
            if (authentifiedPlayer === null)
                throw "unauthorized";
            return Q.nfcall(DB.Models.Game.findOne.bind(DB.Models.Game),
                {_id:req.params.id, _deleted:false});
        }).then(function (game) {
            // mark the game as deleted
            game._deleted = true;
            return DB.save(game);
        }).then(function () {
            res.send('{}'); // smallest json.
        }, app.defaultError(res));
});

/*
 * List clubs
 *
 *
 */
app.get('/v2/admin/clubs/', function(req, res){
    var fields = req.query.fields || "name,location.city,sport,address,outdoor,indoor,countPlayers,countTeams";
    var limit = req.query.limit || 20;
    var sort = req.query.sort || "name";
    var text = req.query.q;
    var longitude = req.query.longitude;
    var latitude = req.query.latitude;
    var distance = req.query.distance;
    var sport = req.query.sport || "tennis";

    // searching
    var query = DB.Models.Club
        .find({_deleted:false})
        .select(fields.replace(/,/g, " "));
    if (text) {
        text = new RegExp("("+text.searchable().pregQuote()+")");
        query.or([
            { _searchableName: text }
        ]);
    }

    if (sport)
        query.where('sport', sport);
    //query.where('_deleted', false);
    query.sort(sort.replace(/,/g, " "))
        .limit(limit)
        .exec(function (err, clubs) {
            if (err)
                return app.defaultError(res)(err);
            res.send(JSON.stringifyModels(clubs));
        });

});

/**
 * Read All Streams reported
 *
 */
app.get('/v2/admin/streams/', function(req, res){
    var limit = req.query.limit || 100;
    var offset = req.query.offset || 0;
    var text = req.query.q;
    var sort = "-dates.start";

    var query = DB.Models.Game.find({$and: [{"stream._reported":true},{"stream._deleted":false}]})

    if (text) {
        text = new RegExp("("+text.searchable().pregQuote()+")");
        query.where("_searchableName", text);
    }
    query.sort(sort.replace(/,/g, " "))
        .skip(offset)
        .limit(limit)
        .exec(function (err, streams) {
            if (err)
                return app.defaultError(res)(err);

            //TODO : don't return good comments
            res.send(JSON.stringify(streams));
        });
});

/*
 * Delete a streamItem
 *
 * /v2/admin/games/:id/streams/:streamid/?_method=delete
 *
 * FIXME: remove from player games.
 */
app.delete('/v2/admin/games/:id/streams/:streamid/', function (req, res) {

    if (typeof req.params.id !== "string")
        return app.defaultError(res)("missing id");

    Authentication.Query.getAdmin(req.query)
        .then(function searchGame(authentifiedPlayer) {
            if (authentifiedPlayer === null)
                throw "unauthorized";
            return Q.nfcall(DB.Models.Game.findOne.bind(DB.Models.Game),
                {_id:req.params.id, _deleted: false});
        }).then(function (game) {
            // search the streamItem
            if (!Array.isArray(game.stream))
                throw "empty stream";
            var streamid = req.params.streamid
                , l = game.stream.length;
            for (var i = 0; i < l; ++i) {
                if (game.stream[i]._id == streamid) {
                    // streamItem found => delete it
                    game.stream[i]._deleted = true;
                    game.stream[i].dates.update = Date.now();
                    return DB.save(game);
                }
            }
            throw "no streamItem found";
            return game;
        }).then(function incr(game) {

            var streamid = req.params.streamid
                , l = game.stream.length, isComment = true;

            for (var i = 0; i < l; ++i) {
                if (game.stream[i]._id == streamid) {
                    if (game.stream[i].type === "image")
                        isComment=false;
                }
            }

            if (isComment==true)
                return Q.nfcall(DB.Models.Game.findByIdAndUpdate.bind(DB.Models.Game),
                    game.id,
                    { $inc: { streamCommentsSize: -1 } });
            else
                return Q.nfcall(DB.Models.Game.findByIdAndUpdate.bind(DB.Models.Game),
                    game.id,
                    { $inc: { streamImagesSize: -1 } });

        }).then(function () {
            res.send('{}'); // smallest json.
        }, app.defaultError(res));
});


/*
 * Update a streamItem
 *
 * /v2/admin/games/:id/streams/:streamid/
 *
 * FIXME: remove from player games.
 */
app.post('/v2/admin/games/:id/streams/:streamid/', function (req, res) {

    if (typeof req.params.id !== "string")
        return app.defaultError(res)("missing id");

    Authentication.Query.getAdmin(req.query)
        .then(function searchGame(authentifiedPlayer) {
            if (authentifiedPlayer === null)
                throw "unauthorized";
            return Q.nfcall(DB.Models.Game.findOne.bind(DB.Models.Game),
                {_id:req.params.id, _deleted: false});
        }).then(function (game) {
            // search the streamItem
            if (!Array.isArray(game.stream))
                throw "empty stream";
            var streamid = req.params.streamid
                , l = game.stream.length;
            for (var i = 0; i < l; ++i) {
                if (game.stream[i]._id == streamid) {
                    // streamItem found => delete it
                    game.stream[i]._reported = false;
                    game.stream[i].dates.update = Date.now();
                    return DB.save(game);
                }
            }
            throw "no streamItem found";
            return game;
        }).then(function () {
            res.send('{}'); // smallest json.
        }, app.defaultError(res));
});

/**
 * Read a club
 *
 * Generic options:
 *  /v2/clubs/?fields=name
 */
app.get('/v2/admin/clubs/:id', function(req, res){

    Authentication.Query.getAdmin(req.query)
        .then(function searchGame(authentifiedPlayer) {
            if (authentifiedPlayer === null)
                throw "unauthorized";
            DB.Models.Club.findOne({_id:req.params.id})
                .exec(function (err, club) {
                    if (err)
                        return app.defaultError(res)(err);
                    if (club === null)
                        return app.defaultError(res)("no club found");
                    res.send(JSON.stringifyModels(club));
                });
        });
});

/**
 * Update a club
 *
 */

app.post('/v2/admin/clubs/:id', express.bodyParser(), function(req, res){

    Authentication.Query.getAdmin(req.query)
        .then(function searchGame(authentifiedPlayer) {
            if (authentifiedPlayer === null)
                throw "unauthorized";
            var query = DB.Models.Club.findOne({_id:req.params.id });
            return Q.nfcall(query.exec.bind(query));
        }).then(function updateClub(club) {

            if (typeof req.body.outdoor !== "undefined")
                club.name = req.body.name;
            if (typeof req.body.outdoor !== "undefined")
                club.location.address = req.body.address;
            if (typeof req.body.outdoor !== "undefined")
                club.location.zip = req.body.zip;
            if (typeof req.body.outdoor !== "undefined")
                club.location.city = req.body.city;
            // might be undefined
            app.log(req.body.sport);
            app.log(typeof req.body.sport);
            if (typeof req.body.sport === "object")
                club.sport = req.body.sport[0];
            if (typeof req.body.outdoor !== "undefined")
                club.outdoor = parseInt(req.body.outdoor, 10);
            if (typeof req.body.indoor !== "undefined")
                club.indoor = parseInt(req.body.indoor, 10);
            if (typeof req.body.countPlayers !== "undefined")
                club.countPlayers = parseInt(req.body.countPlayers, 10);
            if (typeof req.body.countPlayers1AN !== "undefined")
                club.countPlayers1AN = parseInt(req.body.countPlayers1AN, 10);
            if (typeof req.body.countTeams !== "undefined")
                club.countTeams = parseInt(req.body.countTeams, 10);
            if (typeof req.body.countTeams1AN !== "undefined")
                club.countTeams1AN = parseInt(req.body.countTeams1AN, 10);
            if (typeof req.body.school !== "undefined")
                club.school = req.body.school;
            return DB.save(club);
        }).then(
        function (club) { res.send(JSON.stringifyModels(club)) },
        app.defaultError(res)
    );
});

/**
 * Create a new club
 *
 *
 * FIXME: who can create a club? owner?
 */
app.post('/v2/admin/clubs/', express.bodyParser(), function(req, res){

    if (!req.body.name || !req.body.city)
        return app.defaultError(res)("please provide club name & city");
    var data = {};

    Q.all([
            Q.ensure(Authentication.Query.getAdmin(req.query))
                .isNot(null, 'unauthorized')
                .inject(data, 'player'),
            /* old filter : { name: req.body.name, 'location.city': req.body.location.city } */
            Q.ninvoke(DB.Models.Club, 'findOne', { name: req.body.name, 'location.city': req.body.city })
                .inject(data, 'club')
        ]).then(function () {
            if (data.club)
                return app.defaultError(res)("club already registered");
            // creating a new club (no owner)
            req.body.location = (req.body.location) ? req.body.location : {};
            var club = new DB.Models.Club({
                name: req.body.name,
                location : {
                    city: req.body.city || ""
                },
                ligue: req.body.ligue || ""
            });
            // owner
            club.owner = data.player.id;
            // might be undefined
            if (typeof req.body.sport === "object")
                club.sport = req.body.sport[0];

            if (typeof req.body.fedid !== "undefined" && req.body.fedid)
                club.fedid = req.body.fedid;
            if (typeof req.body.outdoor !== "undefined")
                club.outdoor = parseInt(req.body.outdoor, 10);
            if (typeof req.body.indoor !== "undefined")
                club.indoor = parseInt(req.body.indoor, 10);
            if (typeof req.body.countPlayers !== "undefined")
                club.countPlayers = parseInt(req.body.countPlayers, 10);
            if (typeof req.body.countPlayers1AN !== "undefined")
                club.countPlayers1AN = parseInt(req.body.countPlayers1AN, 10);
            if (typeof req.body.countTeams !== "undefined")
                club.countTeams = parseInt(req.body.countTeams, 10);

            return DB.save(club);
        }).then(
        function (club) { res.send(JSON.stringifyModels(club)) },
        app.defaultError(res)
    );
});

/*
 * Delete a club
 *
 * You must be authentified
 *
 * /v2/clubs/:id/?_method=delete
 *
 * FIXME: remove from player games.
 */
app.delete('/v2/admin/clubs/:id/', function (req, res) {

    if (typeof req.params.id !== "string")
        return app.defaultError(res)("missing id");

    Authentication.Query.getAdmin(req.query)
        .then(function searchPlayer(authentifiedPlayer) {
            if (authentifiedPlayer === null)
                throw "unauthorized";
            return Q.nfcall(DB.Models.Club.findOne.bind(DB.Models.Club),
                {_id:req.params.id, _deleted: false});
        }).then(function checkClub(club) {
            if (club === null)
                throw "no club found";
            return club;
        }).then(function (club) {
            // mark the game as deleted
            app.log('on efface le club',club);
            club._deleted = true;
            return DB.save(club);
        }).then(function () {
            res.send('{}'); // smallest json.
        }, app.defaultError(res));
});

if (Conf.env === "DEV") {
  app.get('/documents/games/random', function (req, res) {
    DB.Models.Game.getRandomModel().then(
      function success(game) {
        res.send(JSON.stringify(game));
      },
      app.defaultError(res)
    );
  });

  app.get('/documents/games/:id', function (req, res) {
    DB.Models.Game.findOne({_id:req.params.id})
                 .exec(function (err, game) {
      if (err)
        return app.defaultError(res)(err);
      if (game === null)
        return app.defaultError(res)("no game found");
      res.send(JSON.stringify(game));
    });
  });

  app.get('/documents/players/random', function (req, res) {
    DB.Models.Player.getRandomModel().then(
      function success(player) {
        res.send(JSON.stringify(player));
      },
      app.defaultError(res)
    );
  });

  app.get('/documents/players/:id', function (req, res) {
    DB.Models.Player.findOne({_id:req.params.id})
                   .exec(function (err, player) {
      if (err)
        return app.defaultError(res)(err);
      if (player === null)
        return app.defaultError(res)("no player found");
      res.send(JSON.stringify(player));
    });
  });

  app.get('/documents/clubs/random', function (req, res) {
    DB.Models.Club.getRandomModel().then(
      function success(club) {
        res.send(JSON.stringify(club));
      },
      app.defaultError(res)
    );
  });

  app.get('/documents/clubs/:id', function (req, res) {
    DB.Models.Club.findOne({_id:req.params.id})
                 .exec(function (err, club) {
      if (err)
        return app.defaultError(res)(err);
      if (club === null)
        return app.defaultError(res)("no club found");
      res.send(JSON.stringify(club));
    });
  });
  
  app.get('/documents/files/:id', function (req, res) {
    DB.Models.File.findOne({_id:req.params.id})
                 .exec(function (err, file) {
      if (err)
        return app.defaultError(res)(err);
      if (file === null)
        return app.defaultError(res)("no file found");
      res.send(JSON.stringify(file));
    });
  });


  app.get('/documents/teams/random', function (req, res) {
    DB.Models.Team.getRandomModel().then(
      function success(club) {
        res.send(JSON.stringify(club));
      },
      app.defaultError(res)
    );
  });

  app.get('/documents/teams/:id', function (req, res) {
    DB.Models.Team.findOne({_id:req.params.id})
                 .exec(function (err, club) {
      if (err)
        return app.defaultError(res)(err);
      if (club === null)
        return app.defaultError(res)("no team found");
      res.send(JSON.stringify(club));
    });
  });
};