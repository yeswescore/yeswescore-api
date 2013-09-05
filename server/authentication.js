var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Conf = require('./conf.js')
  , Q = require('q')
  , app = require('./app.js')
  , crypto = require('crypto');

var Authentication = { Query: { } };

// doesn't depend on DB
// but required by db/definitions.js !!
Authentication.generateToken = function () {
  return String(Math.floor(Math.random()*10000000));
};

Authentication.init = function (DB) {
  /**
  * @param object query string ex: ?playerid=...&token=...
  * @return promise(object player/null)
  *
  * options:
  *  facebook: true    allowing facebook auth (facebookid + token)
  */
  Authentication.Query.getPlayer = function (query) {
    // default auth: using our system (playerid & token)
    if (query && query.playerid && query.token) {
      return Q.nfcall(
        DB.Model.Player.findOne.bind(DB.Model.Player),
        {_id: query.playerid, token: query.token}
      );
    }
    return Q.resolve(null);
  };

  /**
  * @param object query string ex: ?playerid=...&token=...
  * return promise player / throw exception elseif
  */
  Authentication.Query.authentify = function (query) {
    return Authentication.Query.getPlayer(query)
                        .then(function (p) {
                            if (p === null) throw "unauthorized";
                            return p;
                          });
  };

  /**
  * @param object query string ex: ?playerid=...&token=...
  * return promise true / false
  */
  Authentication.Query.isAuthentified = function (query) {
    return Authentication.Query.getPlayer(query)
                        .then(function (p) { return p !== null });
  };
};

module.exports = Authentication;