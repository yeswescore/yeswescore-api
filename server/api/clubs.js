var DB = require("../db.js")
  , app = require("../app.js");

// searching a specific club
app.get('/v1/clubs/:id', function(req, res){
  var body = JSON.stringify(DB.searchById(DB.clubs, req.params.id));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});