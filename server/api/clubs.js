var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js");

// searching a specific club
app.get('/v1/clubs/:id', function(req, res){
  var body = JSON.stringify(DB.searchById(DB.clubs, req.params.id));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
});

app.post('/v1/clubs', express.bodyParser(), function(req, res){
  if (req.body.name) {
    // creating a new club (no owner)
    var club = {
        id: DB.generateFakeId(),
        name: null
    };
    //
    ["name"].forEach(function (o) {
      if (typeof req.body[o] !== "undefined")
        club[o] = req.body[o];
    });
    //
    DB.clubs.push(club);
    // sending back saved data to the client
    var body = JSON.stringify(club);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(body);
  } else {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({error:"please provide club name"}));
  }
});