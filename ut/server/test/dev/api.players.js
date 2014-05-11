var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");
  
if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:players', function(){
  describe('read random document player, then read api player should be a valid player', function(){
    it('should give player (not empty & valid)', function (done){
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      
      http.getJSON(options, function (randomplayer) {
        assert.isObject(randomplayer, "random player must exist");
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+randomplayer._id
        };
        http.getJSON(options, function (player) {
          assert.isPlayer(player, "must be a player");
          assert(player.id === randomplayer._id, "must be same player");
          done();
        });
      });
    });
  });
  
  describe('create basic player, then read it.', function () {
    it('should create the player (not empty & valid)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var newPlayer = {
        name: "TU-"+Math.random(),
        email: { address: "marcd-"+Math.random()+"@yeswescore.com" },
        idlicense: "TU-"+Math.random(),
        rank: "15/2",
        language: "en",
        uncryptedPassword: "TU-"+Math.random(),
        club: null
      };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        assert(newPlayer.name === player.name, "must have same name");
        assert(newPlayer.rank === player.rank, "must have same rank");
        assert(newPlayer.email.address === player.email.address, "must have same email");
        assert(newPlayer.idlicense === player.idlicense, "must have same idlicense");
        assert(newPlayer.language === player.language, "must have same language");
        assert(typeof player.password === "undefined", "musn't have a password");
        assert(typeof player.uncryptedPassword === "undefined", "musn't have an uncryptedPassword");
        
        // verify player exist in DB.
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+player.id
        };
        http.getJSON(options, function (p) {
          assert.isPlayer(p, "must be a player");
          assert(p.id === player.id, "must be same player");
          assert(p.name === player.name, "must have same name");
          assert(p.rank === player.rank, "must have same rank");
          assert(p.email.address === player.email.address, "must have same email");
          assert(p.idlicense === player.idlicense, "must have same idlicense");
          assert(p.language === player.language, "must have same language");
          done();
        });
      });
    });
  });
  
  describe('create basic player, language is non standard, then read it.', function () {
    it('should be english by default ', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var newPlayer = {
        name: "TU-"+Math.random(),
        email: { address: "marcd-"+Math.random()+"@yeswescore.com" },
        idlicense: "TU-"+Math.random(),
        rank: "15/2",
        language: "ie-IE",
        uncryptedPassword: "TU-"+Math.random(),
        club: null
      };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        assert(newPlayer.name === player.name, "must have same name");
        assert(newPlayer.rank === player.rank, "must have same rank");
        assert(newPlayer.email.address === player.email.address, "must have same email");
        assert(newPlayer.idlicense === player.idlicense, "must have same idlicense");
        assert(typeof player.password === "undefined", "musn't have a password");
        assert(typeof player.uncryptedPassword === "undefined", "musn't have an uncryptedPassword");
        //
        assert(player.language === "en", "must be default language (" + newPlayer.language + ")");
        
        // verify player exist in DB.
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+player.id
        };
        http.getJSON(options, function (p) {
          assert.isPlayer(p, "must be a player");
          assert(p.id === player.id, "must be same player");
          assert(p.name === player.name, "must have same name");
          assert(p.rank === player.rank, "must have same rank");
          assert(p.email.address === player.email.address, "must have same email");
          assert(p.idlicense === player.idlicense, "must have same idlicense");
          //
          assert(p.language === "en", "must be default language");
          done();
        });
      });
    });
  });
  
  describe('create two player with the same email', function () {
    it('should be an error on the second player', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var email = "marcd-"+Math.random()+"@yeswescore.com";
      var newPlayer = {
        name: "TU-"+Math.random(),
        email: { address: email }
      };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        assert(newPlayer.name === player.name, "must have same name");
        assert(newPlayer.email.address === player.email.address, "must have same email");
        
        // verify player exist in DB.
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]
        };
        newPlayer = {
          name: "TU-"+Math.random(),
          email: { address: email } // same email
        };
        http.post(options, newPlayer, function (player) {
          assert.isError(player);
          assert(player.error == "email already registered", "error should be email already registered");
          done();
        });
      });
    });
  });
  
  describe('create basic player default values, then read it.', function () {
    it('should create the player (not empty & valid)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var newPlayer = { };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
          assert(player.name === "", "name should be empty string");
          assert(player.rank === "", "rank should be empty string");
          assert(typeof player.email === "undefined", "email should be undefined");
          assert(player.idlicense === "", "idlicense should be empty string");
        
        // verify player exist in DB.
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+player.id
        };
        http.getJSON(options, function (p) {
          assert.isPlayer(p, "must be a player");
          assert(p.id === player.id, "must be same player");
          assert(p.name === "", "name should be empty string");
          assert(p.rank === "", "rank should be empty string");
          assert(typeof p.email === "undefined", "email should be undefined");
          assert(p.idlicense === "", "idlicense should be empty string");
          done();
        });
      });
    });
  });
  
  describe('create player with club, then read it.', function () {
    it('should create the player (not empty & valid)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub);
        assert.isId(randomClub._id);
        assert.isString(randomClub.name);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]
        };
        
        var newPlayer = {
          name: "TU-"+Math.random(),
          rank: "15/2",
          club: { id: randomClub._id, name: randomClub.name }
        };
        http.post(options, newPlayer, function (player) {
          assert.isPlayerWithToken(player);
          assert(newPlayer.name === player.name, "must have same name");
          assert(newPlayer.rank === player.rank, "must have same rank");
          
          // verify player exist in DB.
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+player.id
          };
          http.getJSON(options, function (p) {
            assert.isPlayer(p, "must be a player");
            assert(p.id === player.id, "must be same player");
            assert.isObject(newPlayer.club, "newPlayer.club must be an object");
            assert(newPlayer.club.id === p.club.id, "must be same club");
            assert(newPlayer.club.name === p.club.name, "must have same club name");
            done();
          });
        });
      });
    });
  });
  
  describe('create player with club, then modify it.', function () {
    it('should create the player (not empty & valid)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub);
        assert.isId(randomClub._id);
        assert.isString(randomClub.name);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]
        };
        
        var newPlayer = {
          name: "TU-"+Math.random(),
          rank: "15/2",
          email: { address: "marcd-"+Math.random()+"@yeswescore.com" },
          club: { id: randomClub._id, name: randomClub.name }
        };
        http.post(options, newPlayer, function (player) {
          assert.isPlayerWithToken(player);
          assert(newPlayer.name === player.name, "must have same name");
          assert(newPlayer.rank === player.rank, "must have same rank");
          assert(newPlayer.email.address === player.email.address, "must have same email");
          
          // modify the player
          player.name = "foobar";
          player.email.address = "marcd-"+Math.random()+"@yeswescore.com";
          // saving
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+player.id+"/?playerid="+player.id+"&token="+player.token
          };
          http.post(options, player, function (modifiedPlayer) {
            assert.isPlayerWithToken(modifiedPlayer, "must be a player");
            assert(modifiedPlayer.id === player.id, "must be same player");
            assert(modifiedPlayer.name === player.name, "must have the same modified name");
            assert(modifiedPlayer.email.address === player.email.address, "must have the same modified email");
            
            // reading from DB authentified
            http.getJSON(options, function (p) {
              assert.isPlayerWithToken(p, "must be a player");
              assert(p.id === player.id, "must be same player");
              assert(p.name === player.name, "must have the same modified name");
              assert(p.email.address === player.email.address, "must have the same modified email");
              
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["api.players"]+player.id
              };
              // reading from DB unauthentified
              http.getJSON(options, function (p) {
                assert.isPlayer(p, "must be a player");
                assert(p.id === player.id, "must be same player");
                assert(p.name === player.name, "must have the same modified name");
                done();
              });
            });
          });
        });
      });
    });
  });
  
  describe('create player, then modify its email.', function () {
    it('should modify the email but not backup it, status should be "pending-confirmation"', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var oldMail = "marcd-"+Math.random()+"@yeswescore.com";
      var newPlayer = {
        name: "TU-"+Math.random(),
        email: { address: oldMail },
      };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        assert(newPlayer.name === player.name, "must have same name");
        assert(newPlayer.email.address === player.email.address, "must have same email");
        assert(player.email.status === "pending-confirmation", "email status must be pending");
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+player.id+"/?playerid="+player.id+"&token="+player.token
        };
        var newMail =  "marcd-"+Math.random()+"@yeswescore.com";
        var modifiedPlayer = {
          email: { address: newMail }
        };
          
        http.post(options, modifiedPlayer, function (player) {
          assert.isPlayerWithToken(player);
          assert(player.email.address == newMail, "must have same new mail ("+newMail+" Vs "+player.email.address+" Vs "+oldMail);
          assert(player.email.status === "pending-confirmation", "new mail status must be pending");
        
          // now we "unregister our email"
          var modifiedPlayer = { email: { address: "" } };
          http.post(options, modifiedPlayer, function (player) {
            assert.isPlayerWithToken(player);
            assert(typeof player.email === "undefined", "must have email removed");
          
            done();
          });
        });
      });
    });
  });
  
  describe('try to modify player without token', function () {
    it('should generate an unauthrorized error', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer);
        assert.isId(randomPlayer._id);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+randomPlayer._id
        };
        
        // modify player
        randomPlayer.name = "foobar";
        // try post without auth tokens
        http.post(options, randomPlayer, function (error) {
          assert.isError(error);
          assert(error.error === "player not authenticated", "must be an unauthorized error");
          done();
        });
      });
    });
  });
  
  describe('try to modify other player (without good token)', function () {
    it('should generate an unauthrorized error', function (done) {
      // first, read a randomPlayer
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.players"]+"random"
      };
      http.getJSON(options, function (randomPlayer) {
        assert.isObject(randomPlayer);
        assert.isId(randomPlayer._id);

        // second, create a new player
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]
        };
        
        var newPlayer = {
          name: "TU-"+Math.random(),
          rank: "15/2",
          club: null
        };
        http.post(options, newPlayer, function (player) {
          assert.isPlayerWithToken(player);
          
          // third, new player try to modify randomPlayer
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+randomPlayer._id+"/?playerid="+player.id+"&token="+player.token
          };

          var i = 0;
          var cb = function () { i++; if (i == 2) done() };
          
          // try post
          http.post(options, player, function (error) {
            assert.isError(error);
            assert(error.error === "player not owned", "wrong format error");
            cb();
          });
          player.id = randomPlayer.id;
          http.post(options, player, function (error) {
            assert.isError(error);
            assert(error.error === "player not owned", "unauthorized error");
            cb();
          });
        });
      });
    });
  });
  
  describe('update a player (name,rank,password,club,gender,push,birth)', function () {
    it('should modify the player (name,rank,password,club,gender,push,birth)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["documents.clubs"]+"random"
      };
      http.getJSON(options, function (randomClub) {
        assert.isObject(randomClub);
        assert.isId(randomClub._id);
        assert.isString(randomClub.name);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+"random"
        };
        http.getJSON(options, function (randomPlayer) {
          assert.isObject(randomPlayer);
          assert.isId(randomPlayer._id);
          
          var playerid = randomPlayer._id;
          var now = new Date().getTime();
          var rnd = function () { return String(Math.round(Math.random() * 1000000)); }
          var name = "name"+now +rnd();
          var rank = "rank"+now +rnd();
          var clubid = randomClub._id;
          //
          var city = "Bayeux"+Math.random();
          var address =  "random adress " + Math.random();
          var zip = "zip"+Math.random();
          var gender = (randomPlayer.gender == "man") ? "woman" : "man";
          var birth = new Date();
          var push_platform = "android";
          var push_token = randomPlayer._id; 
          //
          var uncryptedPassword = "password"+now +rnd();
          var language = (randomPlayer.language == "fr") ? "en" : "fr";
          
          var modifiedPlayer = {
            id: playerid,
            name: name,
            rank: rank,
            gender: gender,
            uncryptedPassword: uncryptedPassword,
            club: { id: clubid },
            dates: { birth : birth },
            push: { platform : push_platform, token : push_token },
            location : { city : city, address: address, zip : zip },            
            language: language
          };
          
          // saving
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+playerid+"/?playerid="+playerid+"&token="+randomPlayer.token
          };
          
          http.post(options, modifiedPlayer, function (player) {
            assert.isPlayerWithToken(player);
            assert(modifiedPlayer.name === player.name, "must have same name");
            assert(modifiedPlayer.rank === player.rank, "must have same rank");
            assert(modifiedPlayer.club.id === player.club.id, "must have same club");
            assert(modifiedPlayer.language === player.language, "must have same language");
            
            assert(modifiedPlayer.gender === player.gender, "must have same gender");            
            assert(JSON.parse(JSON.stringify(modifiedPlayer.dates.birth)) === player.dates.birth, "must have same birth"); 
            
            assert(modifiedPlayer.push.platform === player.push.platform, "must have same push platform");
            assert(modifiedPlayer.push.token === player.push.token, "must have same push token");

            assert(modifiedPlayer.location.city === player.location.city, "must have same location city");
            assert(modifiedPlayer.location.address === player.location.address, "must have same location address");
            assert(modifiedPlayer.location.zip === player.location.zip, "must have same location zip");            
                        
            // the password shouldn't be the same !
            assert(typeof player.password === "undefined", "must have no password");
            assert(typeof player.uncryptedPassword === "undefined", "can't have uncryptedPassword");
            assert(player.password !== "", "must be a non empty string");
            
            // read from DB
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.players"]+playerid
            };
            http.getJSON(options, function (player) {
              assert.isPlayer(player);
              assert(modifiedPlayer.name === player.name, "must have same name");
              assert(modifiedPlayer.rank === player.rank, "must have same rank");
              assert(modifiedPlayer.club.id === player.club.id, "must have same club");
              assert(player.club.id === randomClub._id, "must have same club id");
              assert(modifiedPlayer.language === player.language, "must have same language");
              assert(typeof player.uncryptedPassword === "undefined", "can't have uncryptedPassword");
              
	          assert(modifiedPlayer.gender === player.gender, "must have same gender");            
	          //badformat assert(modifiedPlayer.dates.birth === player.dates.birth, "must have same birth");
              assert(JSON.parse(JSON.stringify(modifiedPlayer.dates.birth)) === player.dates.birth, "must have same birth"); 	          
	          assert(modifiedPlayer.push.platform === player.push.platform, "must have same push platform");
                         
              
            });
            
            //verify documents
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["documents.players"]+player.id
            };
            
            http.getJSON(options, function (docPlayer) {
              assert.isObject(docPlayer);
              assert(modifiedPlayer.push.token === docPlayer.push.token, "doc must have same push token");	
	          assert(modifiedPlayer.location.city === docPlayer.location.city, "doc must have same location city");
	          assert(modifiedPlayer.location.address === docPlayer.location.address, "doc must have same location address");
	          assert(modifiedPlayer.location.zip === docPlayer.location.zip, "doc must have same location zip"); 
            
              done();
            });
            
          });
        });
      });
    });
  });
  
  describe('create basic player, located in bora bora, then search it from tupai within 50km & search it from 10km', function () {
    it('should find the player first (50km) and not find him (10km)', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var positions = {
        borabora : [ -151.741305, -16.500436 ],
        tupai : [ -151.816893, -16.249431 ]
      };
      
      var nameFilter = "toto"+Math.random();
      
      var newPlayer = { 
        location: {
          currentPos: positions.borabora
        },
        name: nameFilter
      };
      
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        
        // verify player exist in DB.
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.players"]+"?longitude="+positions.tupai[0]+"&latitude="+positions.tupai[1]+"&distance=50&q="+nameFilter
        };
        http.getJSON(options, function (players) {
          assert.isArray(players, 'players should be an array');
          assert(players.length === 1, 'must have found at least one player !');
          assert(players[0].id == player.id, 'must have same id :' + player.id + ' vs ' + players[0].id);
          
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.players"]+"?longitude="+positions.tupai[0]+"&latitude="+positions.tupai[1]+"&distance=10&q="+nameFilter
          };
          
          http.getJSON(options, function (players) {
            assert.isArray(players, 'players should be an array');
            assert(players.length === 0, 'shouldnt find a player');
            
            done();
          });
        });
      });
    });
  });
  
  describe('create a player, confirm its password, reset the password', function () {
    it('should be ok', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var email = "marcd-"+Math.random()+"@yeswescore.com";
      var newPlayer = {
        name: "TU-"+Math.random(),
        email: { address: email }
      };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        assert(newPlayer.name === player.name, "must have same name");
        assert(newPlayer.email.address === player.email.address, "must have same email");
        
        // now confirm the password (using the token)
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["documents.players"]+player.id
        };
        http.getJSON(options, function (docPlayer) {
          assert.isObject(docPlayer);
          assert(docPlayer._id == player.id, "doc & player should have the same id");
          assert(typeof docPlayer.email._token === "string", "docPlayer should have email token");
          
          var emailToken = docPlayer.email._token;
          var options = {
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.email"]+"confirm/?token="+emailToken
          };
          
          http.is302OK(options, function (res) {
            var successUrl = "http://www.yeswescore.com/static/mail-confirm.html";
            if (res.headers.location !== successUrl)
              throw "bad location, " + res.headers.location + " should be " + successUrl;
              
            // read the player again (should be confirmed)
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["documents.players"]+player.id
            };
            
            http.getJSON(options, function (docPlayer) {
              assert(docPlayer.email.status === "confirmed", "status should be confirmed");
              
              var oldEncryptedPassword = docPlayer.password;
              
              // now the status is confirmed, we can try reset the password !
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["api.auth"]+"resetPassword/"
              };
              
              http.post(options, { email: { address: email } }, function (result) {
                assert(typeof result === "object", "result must be an object");
                assert(typeof result.error === "undefined", "result shouldn't be an error");
                
                // now we check if encrypted password has realy changed !
                // FIXME: one day, we should really check email results...
                
                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: Conf["documents.players"]+player.id
                };
                http.getJSON(options, function (docPlayer) {
                  assert(docPlayer.password !== oldEncryptedPassword, "password should have changed");
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  
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
            club: { id: randomClub._id, name: randomClub.name }
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
              
              http.getJSON(options, function (playerUpdated) {
                assert.isPlayerWithToken(playerUpdated, "must be a player");
                
                assert(playerUpdated.following.indexOf(randomPlayer._id) !== -1, "playerUpdated following must contain id " + randomPlayer._id);
                
                // on supprime le following
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
              });
            });
          });
        });
      });
    });
  });
  
  describe('FIXME: read players filtering by club', function() {
    it('should read player checking params: security, pregQuote, ...', function (done) {
      done(/* FIXME */);
    });
  });
  
  describe('FIXME: read players filtering by club', function() {
    it('should read players using filter ?club=:id', function (done) {
      done(/* FIXME */);
    });
  });
});