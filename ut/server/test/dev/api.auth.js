var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");
  
if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:auth', function(){
  describe('create a player with password, check auth', function(){
    it('shoud work!', function (done) {
      var options = {
        host: Conf["http.host"],
        port: Conf["http.port"],
        path: Conf["api.players"]
      };
      
      var newPlayer = {
        nickname : "TU-"+Math.random(),
        name: "TU-"+Math.random(),
        email: { address: "marcd-"+Math.random()+"@yeswescore.com" },
        idlicense: "TU-"+Math.random(),
        rank: "15/2",
        uncryptedPassword: String(Math.random()),
      };
      http.post(options, newPlayer, function (player) {
        assert.isPlayerWithToken(player);
        
        var options = {
          host: Conf["http.host"],
          port: Conf["http.port"],
          path: Conf["api.auth"]
        };
        
        var body = {
          email: { address: newPlayer.email.address },
          uncryptedPassword: newPlayer.uncryptedPassword
        };
        
        http.post(options, body, function (player) {
          assert.isPlayerWithToken(player);
          
          assert(newPlayer.name === player.name, "must have same name");
          assert(newPlayer.nickname === player.nickname, "must have same nickname");
          assert(newPlayer.rank === player.rank, "must have same rank");
          assert(newPlayer.email.address === player.email.address, "must have same email");
          
          done();
        });
      });
    });
  });
});
  