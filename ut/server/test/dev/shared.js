//
//
// Ensemble de fonctions aux differents tests unitaires
//
//
var assert = require("../../lib/assert.js")
  , http = require("../../lib/http.js")
  , Conf = require("../../../../server/conf.js")
  , Q = require("../../../../server/q.js");

if (Conf.env !== "DEV")
  process.exit(0);

var DB = {};
DB.toStringId = function (o) {
  if (typeof o === "string")
    return o;
  if (typeof o === "object" && o && o.id) // null is an object
    return DB.toStringId(o.id);
  if (typeof o === "object" && o && o._id) // null is an object
    return DB.toStringId(o._id);
  return null;
};

var API = {};
API.Club = {};
API.Club.random = function () {
  var deferred = Q.defer();

  var options = {
    host: Conf["http.host"],
    port: Conf["http.port"],
    path: Conf["documents.clubs"]+"random"
  };

  http.getJSON(options, function (randomclub) {
    assert.isObject(randomclub, "random club must exist");

    deferred.resolve(randomclub);
  });
  return deferred.promise;
};

API.getRandomGame = function () {
  var deferred = Q.defer();

  var options = {
    host: Conf["http.host"],
    port: Conf["http.port"],
    path: Conf["documents.games"]+"random"
  };

  http.getJSON(options, function (randomGame) {
    assert.isObject(randomGame, "random game must exist");

    deferred.resolve(randomGame);
  });
  return deferred.promise;
};

API.Player = {};
API.Player.random = function () {
  var deferred = Q.defer();

  var options = {
    host: Conf["http.host"],
    port: Conf["http.port"],
    path: Conf["documents.players"]+"random"
  };

  console.log("API.Player.random "+options);

  http.getJSON(options, function (randomPlayer) {
    assert.isObject(randomPlayer, "random player must exist");

    deferred.resolve(randomPlayer);
  });
  return deferred.promise;
};



API.Team = {};
API.Team.read = function (teamId) {
  var deferred = Q.defer();
  
  var options = {
    host: Conf["http.host"],
    port: Conf["http.port"],
    path: Conf["api.teams"]+teamId
  };

  http.getJSON(options, function (team) {
    assert.isTeam(team, "must be a team");
    assert(team.id === teamId, "must be same team");

    deferred.resolve(team);
  });
  return deferred.promise;
};

API.Team.create = function (team, playerid, token) {
  var deferred = Q.defer();
  
  var options = {
    host: Conf["http.host"],
    port: Conf["http.port"],
    path: Conf["api.teams"]+"?playerid="+playerid+"&token="+token
  };

  http.post(options, team, function (team) {
    assert.isTeam(team);

    deferred.resolve(team);
  });
  return deferred.promise;
};

API.Team.update = function (team, playerid, token) {
  var deferred = Q.defer();

  var options = {
    host: Conf["http.host"],
    port: Conf["http.port"],
    path: Conf["api.teams"]+team.id+"/?playerid="+playerid+"&token="+token
  };

  http.post(options, team, function (team) {
    assert.isTeam(team);

    deferred.resolve(team);
  });
  return deferred.promise;
};

API.Team.random = function () {
  var deferred = Q.defer();

  var options = {
    host: Conf["http.host"],
    port: Conf["http.port"],
    path: Conf["documents.teams"]+"random"
  };

  http.getJSON(options, function (randomTeam) {
    assert.isObject(randomTeam, "random team must exist");

    deferred.resolve(randomTeam);
  });
  return deferred.promise;
};

var computeStreamCommentsSize = function (stream) {
  assert(Array.isArray(stream));

  var i, cpt = 0;
  for (i = 0; i < stream.length; ++i) {
    if (stream[i].type === "comment" &&
        stream[i]._deleted === false)
      cpt++;
  }
  return cpt;
};

var Shared = { API: API, DB: DB, computeStreamCommentsSize: computeStreamCommentsSize };
module.exports = Shared;
