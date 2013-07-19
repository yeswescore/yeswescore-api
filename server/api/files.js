var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Conf = require("../conf.js")
  , Q = require("q")
  , mkdirp = require('mkdirp')
  , fs = require('fs');  
  
/**
 * High level api used to POST a picture
 * 
 * You must be Authentified (playerid & token)
 * 
 * Data should be data=:image\/\w+;base64,
 * 
 * Mandatory option:
 *  /v2/files/?mimeType=image       (default=image,video,sound)
 * 
 * Specific options (metadata):
 *  /v2/files/?width=400            (px)
 *  /v2/files/?height=200           (px)
 *  /v2/files/?orientation=portrait (default=undefined,portrait,landscape)
 *  /v2/files/?longitude=40.234      (default=undefined)
 *  /v2/files/?latitude=40.456       (default=undefined)
 * 
 * data posted should be the data=data-uri (base64 jpeg) 
 *
 * FIXME: path is based on id, but the id could be predictable 
 *        we might use a checksum over the id to restrict access
 */
app.post('/v2/files/', express.bodyParser(), function(req, res){
  if (typeof req.body.data !== "string")
    return app.defaultError(res)("missing data");
  if (!req.query.mimeType ||
      DB.Definition.File.mimeType.enum.indexOf(req.query.mimeType) === -1)
    return app.defaultError(res)("unknown mimeType");
  if (req.query.mimeType !== "image/jpeg")
    return app.defaultError(res)("mimeType must be image");
  
  var pathInfos, file, buffer;
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
        if (!authentifiedPlayer)
          throw "player not authenticated";
        return 
    }).then(function () {
      var data = req.body.data.replace(/^data:image\/\w+;base64,/, "");
      buffer = new Buffer(data, 'base64');
      var checksum = DB.Model.File.checksum(buffer);

      file = new DB.Model.File({
        // custom unpredictable random id
        _id: checksum + "-" +  req.query.playerid,
        owner: req.query.playerid,
        mimeType: "image/jpeg",
        bytes: buffer.length,
        metadata: { }
      });
      // computing path
      pathInfos = DB.Model.File.idTypeToPathInfos(file.id, file.mimeType);
      file.path = pathInfos.path;
      //
      if (req.query.width)
        file.metdata.width = req.query.width;
      if (req.query.height)
        file.metadata.height = req.query.height;
      if (req.query.orientation)
        file.metadata.orientation = req.query.orientation;
      if (req.query.longitude && req.query.latitude)
        file.metadata.pos = [
          parseFloat(req.query.longitude),
          parseFloat(req.query.latitude)
        ];
      return DB.saveAsync(file);
    }).then(function () {
      // creating directory on disk
      var directory = Conf.get("files.path")+pathInfos.directory;
      return Q.nfcall(mkdirp, directory);
    }).then(function () {
      // creating file
      return Q.nfcall(
        fs.writeFile.bind(fs),
        Conf.get("files.path")+pathInfos.path,
        buffer);
    }).then(function () {
      res.send(JSON.stringifyModels(file));
    }, app.defaultError(res));
});


/*
 * api simulating dropbox service
 * @see https://www.dropbox.com/developers/core/docs#files_put
 * 
 * POST /v2/files_put/<root>/<path>?param=val
 *
 * @return:
  {
    "size": "225.4KB",
    "rev": "35e97029684fe",
    "thumb_exists": false,
    "bytes": 230783,
    "modified": "Tue, 19 Jul 2011 21:55:38 +0000",
    "path": "/Getting_Started.pdf",
    "is_dir": false,
    "icon": "page_white_acrobat",
    "root": "dropbox",
    "mime_type": "application/pdf",
    "revision": 220823
  }
 *
 */

/*
 * UT = $.get("http://plic.no-ip.org:22222/documents/players/random", function (player) { $.post("http://plic.no-ip.org:22222/v2/files/?playerid="+player._id+"&token="+player.token+"&mimeType=image/jpeg", { data: "data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABkAAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlCNDA1N0EyRkNEQzExRTE5NEEyOEY1NEFFMzlEMzVFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlCNDA1N0EzRkNEQzExRTE5NEEyOEY1NEFFMzlEMzVFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUI0MDU3QTBGQ0RDMTFFMTk0QTI4RjU0QUUzOUQzNUUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUI0MDU3QTFGQ0RDMTFFMTk0QTI4RjU0QUUzOUQzNUUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAABAQEBAQEBAQEBAQEBAQEBAQEB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" }, function () { console.log('yes'); }); });
 */
