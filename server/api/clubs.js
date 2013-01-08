var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js");

app.get('/v1/clubs/:id', function(req, res){
    DB.Model.Club.findOne({_id:req.params.id})
                 .exec(function (err, club) {
      if (err)
        return app.defaultError(res)(err);
      if (club === null)
        return app.defaultError(res)("no club found");
      res.end(JSON.stringifyModels(club));
    });
});

app.post('/v1/clubs/', express.bodyParser(), function(req, res){
  if (req.body.name) {
    // creating a new club (no owner)
    var club = new DB.Model.Club({
      sport: "tennis",
      name: req.body.name,
      city: req.body.city
    });
    DB.saveAsync(club)
      .then(
        function (club) { res.end(JSON.stringifyModels(club)) },
        app.defaultError(res)
      );
  } else {
    app.defaultError(res)("please provide club name");
  }
});