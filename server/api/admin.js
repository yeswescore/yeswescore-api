var Conf = require("../conf.js")
  , DB = require("../db.js")
  , app = require("../app.js");

if (Conf.env === "DEV") {
  app.get('/admin/kill', function (req, res) {
      console.log('bye bye');
      process.exit(0);
  });
}