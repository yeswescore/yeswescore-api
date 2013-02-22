var app = require("../app.js")
  , winston = require("winston");

var statsLogger = winston.loggers.get('stats');

app.get('/v1/stats/', function (req, res) {
  // we can't disable the prefix "info: " in winston.
  // maybe should fork this project & add options.nolevel
  //  in winston/lib/winston/common.js (low level format)
  statsLogger.info(req.query.q);
  res.end('');
});