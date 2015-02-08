var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Push = require("../../../../server/push.js")
  , Conf = require("../../../../server/conf.js");
  
if (Conf.env !== "DEV")
  process.exit(0);


  describe('create player, then add followings, then remove followings.', function () {
    it('should create the player, update the followings & remove them', function (done) {
      // read random club
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub);
        
        // read random player
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+"random"
        };
        http.getJSON(options, function (randomPlayer) {
          assert.isObject(randomPlayer);
        
          // create player
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]
          };
          
          var newPlayer = {
            name: "TU-"+Math.random(),
            rank: "15/2",
            email: { address: "marcd-"+Math.random()+"@yeswescore.com" },
            club: { id: randomClub._id, name: randomClub.name },
            //push: { platform: "ios",token:"8FBD694A0D96E3EA5C1A70E8B8271E288546B3BFD3831B05896FFCF15D1C39EC" },
            push: { platform: "android",token:"7368b9e5-c61c-43dd-bf09-fbcc838db111" }
          };
          http.post(options, newPlayer, function (player) {
            assert.isPlayerWithToken(player);
            assert(newPlayer.name === player.name, "must have same name");
            assert(newPlayer.rank === player.rank, "must have same rank");
            assert(newPlayer.email.address === player.email.address, "must have same email");
          
            // add random player to following
            var following = { id : randomPlayer._id };
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.players"]+player.id+"/following/?playerid="+player.id+"&token="+player.token
            };
            http.post(options, following, function (result) {
              assert.isObject(result, "must be an object");
              
              // reading from DB
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["api.players"]+player.id+"/?playerid="+player.id+"&token="+player.token
              };

              var follower = {id:player.id};
              
              http.getJSON(options, function (playerUpdated) {
                assert.isPlayerWithToken(playerUpdated, "must be a player");
                
                assert(playerUpdated.following.indexOf(randomPlayer._id) !== -1, "playerUpdated following must contain id " + randomPlayer._id);

                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: "/players/"+playerUpdated.following+"/push"
                };

                http.getJSON(options, function (players) {

                  assert.isArray(players, 'players must be an array of player');
                  assert(players.length > 0, 'must have at least 1 player in result');

                  var found = false;
                  players.forEach(function (p) {
                    if (p.id === follower.id)
                        found = true;
                  });
                  assert(found, 'must have found team id ' + follower.id + ' in team list teams ' + JSON.stringify(players));

                  //send Notification
                  var push = {
                    //TODO : change by table
                    player: {name:"Vincent",id:playerUpdated.following}
                    , player2: {name:"Lucas",id:"4654351351351351"}
                    , opponent: {name:"Benjamin",rank:"15/5"}
                    , opponent2: {name:"Loic",rank:"15/2"}
                    , language:"fr"
                    , status:"finished"
                    , dates: {create:"",start:""}
                    , infos: {type:"double"}
                    , official:"true"
                    , score:"6/1;6/1"
                    , sets:"2/0"
                    , win:"0"
                  };

				  console.log('on envoie ce push',push);

                  Push.sendPushs(null,push,function(err, status){

                      console.log('status', status);
                      assert(status.indexOf('error') === -1, "Error. Check configuration or New API");
                      // DONE() INSIDE to wait push

                      // on supprime le following
					  done();

					  /*
                       var following = { id : randomPlayer._id };
                       var options = {
                       host: Conf["http.host"],
                       port: Conf["http.port"],
                       path: Conf["api.players"]+player.id+"/following/?playerid="+player.id+"&token="+player.token+"&_method=delete"
                       };
                       http.post(options, following, function (result) {
                       assert.isObject(result, "must be an object");

                       // reading from DB
                       var options = {
                       host: Conf["http.host"],
                       port: Conf["http.port"],
                       path: Conf["api.players"]+player.id+"/?playerid="+player.id+"&token="+player.token
                       };

                       http.getJSON(options, function (playerUpdated) {
                       assert.isPlayerWithToken(playerUpdated, "must be a player");

                       assert(playerUpdated.following.indexOf(randomPlayer._id) === -1, "playerUpdated following cannot contain id " + randomPlayer._id);
                         done();
                       });
                       });
						*/


                  });

                  done();

                });

              });
            });
          });
        });
      });
    });
  });
  
  
