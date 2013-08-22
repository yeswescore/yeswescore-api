 var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js");
  
if (Conf.env !== "DEV")
  process.exit(0);

describe('dev:files', function(){
var image = { data: 
          "data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABkAAD/4QMraHR0c" + "DovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a" +
          "2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtY" + "zAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL" +
          "3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtb" +
          "G5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20ve" +
          "GFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjI" +
          "iB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAua" +
          "WlkOjlCNDA1N0EyRkNEQzExRTE5NEEyOEY1NEFFMzlEMzVFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlCNDA1N0EzR" +
          "kNEQzExRTE5NEEyOEY1NEFFMzlEMzVFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6O" +
          "UI0MDU3QTBGQ0RDMTFFMTk0QTI4RjU0QUUzOUQzNUUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUI0MDU3QTFGQ0RDM" +
          "TFFMTk0QTI4RjU0QUUzOUQzNUUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY" +
          "2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBA" +
          "QEBAQEBAgICAgICAgICAgIDAwMDAwMDAwMDAQEBAQEBAQIBAQICAgECAgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA" +
          "wMDAwMDAwMDAwMDAwMDAwMDAwP/wAARCAAnACgDAREAAhEBAxEB/8QAowAAAgICAwAAAAAAAAAAAAAABwoICwUGAwQJAQABB" +
          "AMBAQAAAAAAAAAAAAAFAwQHCAACBgEJEAAABgIBAwIDBQkAAAAAAAABAgMEBQYRBwgAIRIxQVEyCWGBIkIWcZGhsSNjJtYKE" +
          "QACAAUBBAYFCAsBAAAAAAABAgARAwQFBiExQRJRYXGx0QeRIjITFPBCUnJkdMTUgWKSI1Ozw9OUtHUX/9oADAMBAAIRAxEAP" +
          "wBWSkVqnzdWqU1PVCnzs3NVWtTM3NTtVr0xLzMxKQrCQlJWVlJOOdP5GSkXzhRZwusodVVU4mMYRER6PUaVM0V9RCSo+aJzk" +
          "J8IoVrDUmq6ep8rRoZXK06KZO7VFS8uUVVW4qKqqqVQqqoACgAAASEFqLoWsjgUT6y1gf0EQU1zSlPsEPxQZu/b26dpSt9xS" +
          "nP6o8IjW/1XrdSQuczg7MjeD+vBIjtd6kOBc6k1Ec39zVtBP+8DV4cgGelVpW4Mmp05fUHhHGXmsPMFSZah1CB1ZO/H4iNoS" +
          "1vp4QER05pzAYxnU2uxz3ER7/pwRHAB0r7i3kJU6X7C+EAqmtPMUHZqPUc/+rkPzEDXbdC1cw1hst9Fau1dEycdru9SEZKQ+" +
          "uKVEysbJx1XlXjCQjZKPg279g+ZO0CKpLJKEUTOUBKICGekbmhbChU5UpzCE7EEwZHjKO48u9X69r67wdG7z2erWtTNWKPTq" +
          "5G9qU3R7qkro6PXZHRlJVlYFSDIgxHvXbvwo1F7/JSKeGBEAxiuRgeg/H+PQ2k4FNV4co7h1RMGsLQtqbKOBvyd5/s1Ym5pn" +
          "jFyk3nXndv0jxt3/uOpR004rcjZ9V6e2HsKusLC0ZRsm8gnk3Uq5LxrWZaxsw0cKNTqlXIg5RUMUCqkEXDVaaH1mUGW47I5J" +
          "NJZ7M0WusVYXdzQVipalRq1F5gAeUlFIDAEGR2gMOBE7QAv0++BROxOEfEQgfAvGzTRf5UsOgXxFf6b+k+MX0by80A3tYPDn" + "tsrb+3Ffjz04p8htUcheX99PxY3JrnjxXuS+7yVG7Bo26UzS8PruR3XYoLWZq5YyVaNosfTZGOexbWEM2WIzcJLtiNhMCiYD" +
          "0NtWp1KSKXU1eUTE5nZvnx6Y+ffmV5eZfGapy1/b4q6ttNpfVTTqC2qJbLTaqRT5H5BSVCWCoFIXaqqNwjyl2zLCtrDZxAN2" +
          "U1tfifMH5qnMZDAewZ63uD+4qSl7B7oC6Ax/u9cYNpezmrA7vtdGIuUl6ZOnUsoGEPGnVMuMh2/x+NDP2Z6G0yORJ/RHcInr" +
          "U1BzqDJbuU5G7O77RUPRth8D/mk5k8U9CcDtp1LenJ3jrpa3ynLW/WKPq23d26y1rY5CuudOaEjGk/Hwl1tUFJvIR1JRTtum" +
          "6SSOgddqsmBvNM4A0vFZqgIBIC9HWdkTP5QZDE43Tdxb3Vzb0axvnbleoiNI0qInJiDIlSAeMiN4MNwKWNBJQ6SmCqJnMmco" +
          "oq5KcgiUxRwYQyAh0yibYX3+vTzG4r2f6b3LjR1b5Ncd7Bu5jZdNV1zpyA3XrOZ2s2slM5S6iXuNfca6jbU8uCE3U20G/Uk2" +
          "hmRV2BGS4rlTBFTxdWqsKyuQeWe/wDREV+amSxd1obJ46jc27XpRV92tRDUmtVCy8gbmmoBmJTEjPdFdvseWBXX2wCeXz0O6" +
          "J/MGB861KFD3yPr2z0WrOBSdVO0o3DqMVC0dj+TV2IaRJGVszPsuaRgC1N741SpEESh41Ssl7gP5YKPD2x646ZISEXb80d0S" +
          "9naAfP35IInf3PEfxnjbkJAMBkfTv6iOfh6d/X4h6dL80tjQAr46e7j2fL0Q+3I/wDUj9PR/JSDxLWXN1Mjt67dESLqXQKoJ" +
          "EcOFFSkBQeVqInAgHx5CQmfXAenQ74WrKeyUWK/9S02F5mS7HbTX0e33QmLyp3XX968pOTm8Kkymompbq5Fbx23Vouzox7Sy" +
          "R9a2VtG1XWAZWBpESc5FNJxpEziJHabV67QTcFOVNZUoAcz+nNaag7wPlwiuepHt8rnrrJW9NjRrV3dSdhkxnIjpG47SOsxF" +
          "27SvnSronkf6lOtRM5EwfjgJEv7O+esqmdNj+qe49UbactJaixrBJSyNqfRcUz0QKImTbRcRDRboZEzmMhoiOcnj4OwzUedd" +
          "hHNWiykfMwkVIw0uwUUREyLpo4XauEhKokochimFslSQAIMpDgeiJCzGLuGzF46/CkNeVztubRTtqudqtWDKdu1WAYGYIBEZ" +
          "QlkYh8pZwe/tTrqPf7q7jPW/NTnxn2HwgcMPeSJBt+X73Zy/nx2iWZkAgPjP5yHYaZdh7/YIVzPWF14zI7D4Q2fD3vH4Qj73" +
          "Zj8RHP+qG3snYfupd6/13rFccAZdQPhCBwtx02n+XY/mIw1lsKDmt2RsVOc83VdnWpBcVS3Mm5TuYp4iQ7h6/g2rFm3IdQBU" +
          "VWUTSTIAmOYCgI9eVHUg7Dzcp4HoPVuglhMNcLm7Fy1qFW9oNsurMn1ayGQVKxZiZSCqCSZAAkx/9k="
        };
  
  describe('upload jpeg (dataURI)', function(){
    it('should exist on disk, be accessible by http', function (done){
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
          path: Conf["api.files"] + "?"
                                  + "mimeType=image/jpeg&"
                                  + "format=dataURI&"
                                  + "playerid="+randomplayer._id+"&token="+randomplayer.token
        };
        
        http.post(options, image, function (file) {
          assert.isFile(file);
          assert.isString(file.path);
          
          // on regarde si l'image est accessible en http
          var options = { 
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: "/static/files/" + file.path
          }
          http.is200OK(options, done);
        });
      });
    });
  });
  
  describe('upload jpeg (dataURI), save in player profile', function(){
    it('should exist on disk, be accessible by http, & saved in player profile ', function (done){
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
          path: Conf["api.files"] + "?"
                                  + "mimeType=image/jpeg&"
                                  + "format=dataURI&"
                                  + "playerid="+randomplayer._id+"&token="+randomplayer.token
        };
        
        http.post(options, image, function (file) {
          assert.isFile(file);
          assert.isString(file.path);
          
          // on regarde si l'image est accessible en http
          var options = { 
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: "/static/files/" + file.path
          }
          http.is200OK(options, function () {
            // read the player
            var options = {
              host: Conf["http.host"],
              port: Conf["http.port"],
              path: Conf["api.players"]+randomplayer._id
            };
            http.getJSON(options, function (player) {
              assert.isPlayer(player, "must be a player");
              
              // assign picture to player profile
              player.profile = { image : file.id };
              
              // save the player
              var options = {
                host: Conf["http.host"],
                port: Conf["http.port"],
                path: Conf["api.players"]+player.id+"/?playerid="+player.id+"&token="+randomplayer.token
              };
              
              http.post(options, player, function (modifiedPlayer) {
                assert.isPlayerWithToken(modifiedPlayer, "must be a player");
                assert(modifiedPlayer.profile.image === file.id, "profile image must have been saved");
                 
                // read from api again
                var options = {
                  host: Conf["http.host"],
                  port: Conf["http.port"],
                  path: Conf["api.players"]+randomplayer._id
                };
                http.getJSON(options, function (player) {
                  assert.isPlayer(player, "must be a player");
                  
                  assert(player.profile.image === file.id, "profile image must have been saved (2)");
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  
  describe('upload jpeg (dataURI)', function(){
    it('should exist on disk, model readable & good size', function (done){
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
          path: Conf["api.files"] + "?"
                                  + "mimeType=image/jpeg&"
                                  + "format=dataURI&"
                                  + "playerid="+randomplayer._id+"&token="+randomplayer.token
        };
        
        http.post(options, image, function (file) {
          assert.isFile(file);
          assert.isString(file.path);
          
          // on regarde si l'image est accessible en http
          var options = { 
            host: Conf["http.host"],
            port: Conf["http.port"],
            path: Conf["api.files"] + file.id
          }
          http.getJSON(options, function (model) {
            assert.isFile(model)
            assert(model.id == file.id);
            assert(model.bytes == 2921, "size should be 2921");
            
            done();
          });
        });
      });
    });
  });
});