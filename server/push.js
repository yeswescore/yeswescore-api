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

    sendPushMessage: function(payload, callback) {

        var response_data="";
        var rd="";
		
		/*
		curl --include --request POST --header "Content-Type: application/json" --header "Authorization: Basic Y2ZjMmQ2YzItOWQ4Yy0xMWU0LTlkNWQtODcwNzA1MjMzOWU0" --data-binary '{"app_id": "cfc2d62c-9d8c-11e4-9d5c-17bf4d8b652c","contents": {"en": "Record sur YesWeScore"},"isAndroid": true,"isIos": true,"include_player_ids" : ['7368b9e5-c61c-43dd-bf09-fbcc838db111']}' https://gamethrive.com/api/v1/notifications
		*/

        var opts = {
            "host": "gamethrive.com",
			"port": 443,
            "path": "/api/v1/notifications",
            "method": "POST",
            "auth": "",
            "headers": {
                "Content-Type": "application/json",
				"Authorization": "Basic Y2ZjMmQ2YzItOWQ4Yy0xMWU0LTlkNWQtODcwNzA1MjMzOWU0"
            }
        };

        opts.headers["Content-Type"] = "application/json";
		
        rd = JSON.stringify(payload);
        opts.headers["Content-Length"] = Buffer.byteLength(rd, "utf8");

        var request = https.request(opts, function (response) {

            response.setEncoding("utf8");

            response.on("data", function (chunk) {
                response_data += chunk;
            });

            response.on("end", function () {
			
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

    sendPushs: function (err, push, callback) {
        var that = this;
        var msg = "";

        if (push.infos.type.indexOf('singles') != -1) {
            if (push.status.indexOf('ongoing') != -1) {
                msg = Resources.getString(push.language, "game.push.started");
                msg = msg.replace(/%PLAYER1%/g, push.player.name);
                if (typeof push.opponent.name !== "undefined")
                    msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
                if (typeof push.opponent.rank !== "undefined")
                    msg = msg.replace(/%RANK2%/g, push.opponent.rank);
            } else if (push.status.indexOf('created') != -1) {
                msg = Resources.getString(push.language, "game.push.created");
                msg = msg.replace(/%PLAYER1%/g, push.player.name);
                if (typeof push.opponent.name !== "undefined")
                    msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
                if (typeof push.opponent.rank !== "undefined")
                    msg = msg.replace(/%RANK2%/g, push.opponent.rank);
                msg = msg.replace(/%DATE%/g, push.dates.create);
            } else if (push.status.indexOf('finished') != -1) {
                if (push.win === "1") {
                    msg = Resources.getString(push.language, "game.push.finished.win");
                    msg = msg.replace(/%PLAYER1%/g, push.player.name);
                    if (typeof push.opponent.name !== "undefined")
                        msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
                    if (typeof push.opponent.rank !== "undefined")
                        msg = msg.replace(/%RANK2%/g, push.opponent.rank);
                    msg = msg.replace(/%SCORE%/g, push.sets);
                }
                else {
                    msg = Resources.getString(push.language, "game.push.finished.loose");
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
                msg = Resources.getString(push.language, "game.push.double.started");
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
                msg = Resources.getString(push.language, "game.push.double.created");
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
                    msg = Resources.getString(push.language, "game.push.double.finished.win");
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
                    msg = Resources.getString(push.language, "game.push.double.finished.loose");
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

        if (msg !== "") {

            var android = false;
            var android_tab = [];
            var ios = false;
            var ios_tab = [];
			var playerid_tab = [];
			
            http.get({
                    host: Conf.get('http.host'),
                    port: Conf.get('http.port'),
                    path: "/players/" + push.player.id + "/push"
                },
                function (res) {
                    var data = '';

                    res.on('data', function (chunk) {
                        data += chunk;
                    });

                    //get followers
                    res.on('end', function () {
                        var followers = JSON.parse(data);
						
						console.log('followers',followers);

                        followers.forEach(function (follower) {
                            //register
							playerid_tab.push(follower.push.token);
							/*
                            if (follower.push.platform.indexOf('android') != -1) {
                                android = true;
                                android_tab.push(follower.push.token);

                            }

                            if (follower.push.platform.indexOf('ios') != -1) {
                                ios = true;
                                ios_tab.push(follower.push.token);

                            }
							*/
                        });

                        //send

						var payload = {
						'app_id' : "cfc2d62c-9d8c-11e4-9d5c-17bf4d8b652c",
						'isAndroid' : true,
						'isIos' : true,
						'isWP' : true,
						'include_player_ids' : playerid_tab,
						'contents' : {"en":msg,"fr":msg}
						};

						//console.log('payload',payload);
						
						Push.sendPushMessage(payload, function(err){
						  if(err)
							console.log('err',err);
						});
                        
                    });
                });


            /***************/


        }


    }

};

module.exports = Push;