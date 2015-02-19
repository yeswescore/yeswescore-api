var Conf = require("./conf.js")
    , http = require('http')
    , https = require('https')
    , DB = require("./db.js")
    , app = require("./app.js")
    , Resources = require("./strings/resources.js")
    , winston = require("winston");

var pushLogger = winston.loggers.get('push');

var Push = {
// gamethrive

    sendPushMessage: function (payload, appkey, callback) {

        var response_data = "";
        var rd = "";

        var opts = {
            "host": "gamethrive.com",
            "port": 443,
            "path": "/api/v1/notifications",
            "method": "POST",
            "auth": "",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Basic " + appkey
            }
        };

        //console.log('payload ', payload);

        opts.headers["Content-Type"] = "application/json";

        rd = JSON.stringify(payload);
        opts.headers["Content-Length"] = Buffer.byteLength(rd, "utf8");

        var request = https.request(opts, function (response) {

            response.setEncoding("utf8");

            response.on("data", function (chunk) {
                response_data += chunk;
            });

            response.on("end", function () {

                //console.log('GameThrive response.statusCode  ',response.statusCode);

                if ([200, 201, 202, 204].indexOf(response.statusCode) >= 0) {
                    try {
                        switch (true) {
                            case /application\/json/.test(response.headers["content-type"]):
                                callback(null, JSON.parse(response_data));
                                break;
                            default:
                                callback(null, response_data);
                        }

                    }
                    catch (ex) {
                        callback(null, "error");

                    }
                }
                else {
                    callback(null, "error");

                }
            });

            response.on("error", function (error) {
                callback(null, "error");

            });
        });


        request.on("error", function (error) {
            callback(null, "error");

        });

        if (payload) {
            request.write(rd);
        }

        request.end();
    },

    createMsg: function (push, language) {
        var msg = "";

        if (push.infos.type.indexOf('singles') != -1) {

            if (push.status.indexOf('ongoing') != -1) {
                msg = Resources.getString(language, "game.push.started");
                msg = msg.replace(/%PLAYER1%/g, push.player.name);
                if (typeof push.opponent.name !== "undefined")
                    msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
                if (typeof push.opponent.rank !== "undefined")
                    msg = msg.replace(/%RANK2%/g, push.opponent.rank);
            }
            else if (push.status.indexOf('created') != -1) {
                msg = Resources.getString(language, "game.push.created");
                msg = msg.replace(/%PLAYER1%/g, push.player.name);
                if (typeof push.opponent.name !== "undefined")
                    msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
                if (typeof push.opponent.rank !== "undefined")
                    msg = msg.replace(/%RANK2%/g, push.opponent.rank);
                msg = msg.replace(/%DATE%/g, push.dates.create);
            }
            else if (push.status.indexOf('finished') != -1) {
                if (push.win === "1") {
                    msg = Resources.getString(language, "game.push.finished.win");
                    msg = msg.replace(/%PLAYER1%/g, push.player.name);
                    if (typeof push.opponent.name !== "undefined")
                        msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
                    if (typeof push.opponent.rank !== "undefined")
                        msg = msg.replace(/%RANK2%/g, push.opponent.rank);
                    msg = msg.replace(/%SCORE%/g, push.sets);
                }
                else {
                    msg = Resources.getString(language, "game.push.finished.loose");
                    msg = msg.replace(/%PLAYER1%/g, push.player.name);
                    if (typeof push.opponent.name !== "undefined")
                        msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
                    if (typeof push.opponent.rank !== "undefined")
                        msg = msg.replace(/%RANK2%/g, push.opponent.rank);
                    msg = msg.replace(/%SCORE%/g, push.sets);
                }
            }
        }
        //if double
        else {

            if (push.status.indexOf('ongoing') != -1) {
                msg = Resources.getString(language, "game.push.double.started");

                msg = msg.replace(/%PLAYER1%/g, push.player.name);

                if (typeof push.player2.name !== "undefined")
                    msg = msg.replace(/%PLAYER2%/g, push.player2.name);
                if (typeof push.player2.rank !== "undefined")
                    msg = msg.replace(/%RANK2%/g, push.player2.rank);
                if (typeof push.opponent.name !== "undefined")
                    msg = msg.replace(/%PLAYER3%/g, push.opponent.name);
                if (typeof push.opponent.rank !== "undefined")
                    msg = msg.replace(/%RANK3%/g, push.opponent.rank);
                if (typeof push.opponent2.name !== "undefined")
                    msg = msg.replace(/%PLAYER4%/g, push.opponent2.name);
                if (typeof push.opponent2.rank !== "undefined")
                    msg = msg.replace(/%RANK4%/g, push.opponent2.rank);


            } else if (push.status.indexOf('created') != -1) {
                msg = Resources.getString(language, "game.push.double.created");

                msg = msg.replace(/%PLAYER1%/g, push.player.name);

                if (typeof push.player2.name !== "undefined")
                    msg = msg.replace(/%PLAYER2%/g, push.player2.name);
                if (typeof push.player2.rank !== "undefined")
                    msg = msg.replace(/%RANK2%/g, push.player2.rank);
                if (typeof push.opponent.name !== "undefined")
                    msg = msg.replace(/%PLAYER3%/g, push.opponent.name);
                if (typeof push.opponent.rank !== "undefined")
                    msg = msg.replace(/%RANK3%/g, push.opponent.rank);
                if (typeof push.opponent2.name !== "undefined")
                    msg = msg.replace(/%PLAYER4%/g, push.opponent2.name);
                if (typeof push.opponent2.rank !== "undefined")
                    msg = msg.replace(/%RANK4%/g, push.opponent2.rank);

                msg = msg.replace(/%DATE%/g, push.dates.create);

            } else if (push.status.indexOf('finished') != -1) {
                if (push.win === "1") {
                    msg = Resources.getString(language, "game.push.double.finished.win");
                    msg = msg.replace(/%PLAYER1%/g, push.player.name);
                    if (typeof push.player2.name !== "undefined")
                        msg = msg.replace(/%PLAYER2%/g, push.player2.name);
                    if (typeof push.player2.rank !== "undefined")
                        msg = msg.replace(/%RANK2%/g, push.player2.rank);
                    if (typeof push.opponent.name !== "undefined")
                        msg = msg.replace(/%PLAYER3%/g, push.opponent.name);
                    if (typeof push.opponent.rank !== "undefined")
                        msg = msg.replace(/%RANK3%/g, push.opponent.rank);
                    if (typeof push.opponent2.name !== "undefined")
                        msg = msg.replace(/%PLAYER4%/g, push.opponent2.name);
                    if (typeof push.opponent2.rank !== "undefined")
                        msg = msg.replace(/%RANK4%/g, push.opponent2.rank);

                    msg = msg.replace(/%SCORE%/g, push.sets);
                }
                else {
                    msg = Resources.getString(language, "game.push.double.finished.loose");
                    msg = msg.replace(/%PLAYER1%/g, push.player.name);

                    if (typeof push.player2.name !== "undefined")
                        msg = msg.replace(/%PLAYER2%/g, push.player2.name);
                    if (typeof push.player2.rank !== "undefined")
                        msg = msg.replace(/%RANK2%/g, push.player2.rank);
                    if (typeof push.opponent.name !== "undefined")
                        msg = msg.replace(/%PLAYER3%/g, push.opponent.name);
                    if (typeof push.opponent.rank !== "undefined")
                        msg = msg.replace(/%RANK3%/g, push.opponent.rank);
                    if (typeof push.opponent2.name !== "undefined")
                        msg = msg.replace(/%PLAYER4%/g, push.opponent2.name);
                    if (typeof push.opponent2.rank !== "undefined")
                        msg = msg.replace(/%RANK4%/g, push.opponent2.rank);

                    msg = msg.replace(/%SCORE%/g, push.sets);
                }
            }

        }

        return msg;
    },

    // Send notifications
    sendPushs: function (err, push, playerid) {
        var msg_fr = "", msg_en = "";
        msg_fr = this.createMsg(push, "fr");
        msg_en = this.createMsg(push, "en");
        var android = false,android_tab = [];
        var ios = false,ios_tab = [];
        var app_id = "",app_key = "";
        var playerid_tab = [];

        //console.log("On envoie sur  /players/" + playerid + "/push");

        var req = http.get({
                host: Conf.get('http.host'),
                port: Conf.get('http.port'),
                path: "/players/" + playerid + "/push"
            },
            function (res) {
                var data = '';

                res.on('data', function (chunk) {
                    data += chunk;
                });

                //get followers
                res.on('end', function () {
                    var followers = JSON.parse(data);

                    followers.forEach(function (follower) {
                        //register
                        playerid_tab.push(follower.push.token);
                    });

                    //send
                    //get sport and good key
                    if (push.sport === "badminton") {
                        app_id = Conf.get("push.gamethrive.badminton.appid");
                        app_key = Conf.get("push.gamethrive.badminton.appkey");
                    }
                    if (push.sport === "padel") {
                        app_id = Conf.get("push.gamethrive.padel.appid");
                        app_key = Conf.get("push.gamethrive.padel.appkey");
                    }
                    if (push.sport === "speedbadminton") {
                        app_id = Conf.get("push.gamethrive.speedbadminton.appid");
                        app_key = Conf.get("push.gamethrive.speedbadminton.appkey");
                    }
                    if (push.sport === "squash") {
                        app_id = Conf.get("push.gamethrive.squash.appid");
                        app_key = Conf.get("push.gamethrive.squash.appkey");
                    }
                    if (push.sport === "tabletennis") {
                        app_id = Conf.get("push.gamethrive.tabletennis.appid");
                        app_key = Conf.get("push.gamethrive.tabletennis.appkey");
                    }
                    if (push.sport === "tennis") {
                        app_id = Conf.get("push.gamethrive.tennis.appid");
                        app_key = Conf.get("push.gamethrive.tennis.appkey");
                    }

                    if (followers.length > 0) {
                        var payload = {
                            'app_id': app_id,
                            'isAndroid': true,
                            'isIos': false,
                            'isWP': true,
                            'include_player_ids': playerid_tab,
                            'contents': {'en': msg_en, 'fr': msg_fr}
                        };

                        Push.sendPushMessage(payload, app_key, function (err) {
                            if (err)
                                app.log("GAMETHRIVE: "+err, "error");
                        });
                    }

                });
            });

        req.end();
    }

};

module.exports = Push;