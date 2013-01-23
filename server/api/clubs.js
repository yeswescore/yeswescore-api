var DB = require("../db.js")
  , express = require("express")
  , app = require("../app.js");

/**
 * Read a club
 * 
 * Generic options:
 *  /v1/clubs/?fields=name
 */
app.get('/v1/clubs/:id', function(req, res){
  var fields = req.query.fields;
  
  var query = DB.Model.Club.findById(req.params.id);
  if (fields)
    query.select(fields.replace(/,/g, " "));
  query.exec(function (err, club) {
    if (err)
      return app.defaultError(res)(err);
    if (club === null)
      return app.defaultError(res)("no club found");
    res.end(JSON.stringifyModels(club));
  });
});

/*
app.get('/v1/clubs/autocomplete/', function(req, res){
  var fields = req.query.fields || "sport,date_creation,name,city,address,fftid,ligue,zip,outdoor,indoor";
  var limit = req.query.limit || 5;
  var sort = req.query.sort || "name";
  var text = req.query.q;
  
  if (text) {
    // slow
    text = new RegExp("("+text.searchable().pregQuote()+")");
    // searching
    DB.Model.Club
      .find({_searchableName: text})
      .select(fields.replace(/,/g, " "))
      .sort(sort.replace(/,/g, " "))
      .limit(limit)
      .exec(function (err, clubs) {
        if (err)
          return app.defaultError(res)(err);
        res.end(JSON.stringifyModels(clubs));
      });
  } else {
    res.end(JSON.stringify([]));
  }
});
*/

/**
 * Create a new club
 * 
 * Body {
 *   name: String,     (MANDATORY)
 *   city: String,     (default="")
 * }
 * 
 * FIXME: who can create a club? owner?
 */
app.post('/v1/clubs/', express.bodyParser(), function(req, res){
  if (req.body.name) {
    // creating a new club (no owner)
    var club = new DB.Model.Club({
      sport: "tennis",
      name: req.body.name,
      address: req.body.address || "",
      city: req.body.city || ""
    });
    if (Array.isArray(req.body.pos) &&
        req.body.pos.length === 2) {
      club.pos = req.body.pos;
    }
    DB.saveAsync(club)
      .then(
        function (club) { res.end(JSON.stringifyModels(club)) },
        app.defaultError(res)
      );
  } else {
    app.defaultError(res)("please provide club name");
  }
});