var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js")
  , Conf = require("../conf.js")
  , Q = require("q")
  , mkdirp = require('mkdirp')
  , fs = require('fs');  

/**
 * Read a file object
 * 
 * Generic options:
 *  /v2/files/:id/?fields=name
 */
app.get('/v2/files/:id', function(req, res){
  var fields = req.query.fields;
  
  DB.isAuthenticatedAsync(req.query)
    .then(function (authentifiedPlayer) {
      var query = DB.Model.File.findById(req.params.id);
      if (fields)
         query.select(fields.replace(/,/g, " "))
      query.exec(function (err, file) {
        if (err)
          return app.defaultError(res)(err);
        if (file === null)
          return app.defaultError(res)("no file found");
        res.send(JSON.stringifyModels(file));
      });
    },
    app.defaultError(res, "authentication error"));
});

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
 *  /v2/files/?orientation=portrait (default=undefined;portrait,landscape)
 *  /v2/files/?longitude=40.234     (default=undefined)
 *  /v2/files/?latitude=40.456      (default=undefined)
 *  /v2/files/?format=binary        (defaut=binary;binary,dataURI)
 * 
 * data posted should be the data=data-uri (base64 jpeg) 
 *
 * FIXME: path is based on id, but the id could be predictable 
 *        we might use a checksum over the id to restrict access
 */
app.post('/v2/files/', express.bodyParser(), function(req, res){
  var format = req.query.format || "binary";
  
  if (format !== "dataURI" && format !== "binary")
    return app.defaultError(res)("unknown format");
  if (format === "binary" && req.files.file === "undefined")
    return app.defaultError(res)("missing file");
  if (format === "dataURI" && typeof req.body.data !== "string")
    return app.defaultError(res)("missing data (dataURI)");
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
    }).then(function getData() {
      if (format === "dataURI") {
        var data = req.body.data.replace(/^data:image\/\w+;base64,/, "");
        return new Buffer(data, 'base64');
      }
      // binary stream, need to read the file to get the data.
      return Q.nfcall(
        fs.readFile.bind(fs),
        req.files.file.path);
    }).then(function (buf) {
      buffer = buf;
      var checksum = DB.Model.File.checksum(buffer);
      
      file = new DB.Model.File({
        _id: checksum + "-" +  req.query.playerid + "-" + Math.round(Math.random() * 1000),
        owner: req.query.playerid,
        mimeType: "image/jpeg",
        bytes: buffer.length, // should be <=> to bytes: req.files.file.size,
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
    }).then(function createDirectory() {
      var directory = Conf.get("files.path")+pathInfos.directory;
      return Q.nfcall(mkdirp, directory);
    }).then(function writeFileToDisk() {
      return Q.nfcall(
        fs.writeFile.bind(fs),
        Conf.get("files.path")+pathInfos.path,
        buffer);
    }).then(function () {
      res.send(JSON.stringifyModels(file));
    }, app.defaultError(res));
});

