var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Conf = require('./conf.js')
  , Q = require('q')
  , app = require('./app.js')
  , crypto = require('crypto')
  , Authentication = require('./authentication.js');
  
var ObjectId = mongoose.Types.ObjectId;

var DB = {
  status : 'disconnected',
};

// custom JSON api
JSON.stringifyModels = function (m, options) {
  options = options || {};
  if (options && typeof options.virtuals === "undefined")
    options.virtuals = true;
  if (options && typeof options.transform === "undefined")
    options.transform = true;
  if (Array.isArray(m)) {
    return JSON.stringify(m.map(function (model) {
      return model.toObject(options);
    }));
  }
  return JSON.stringify(m.toObject(options));
};

DB.toStringId = function (o) {
  if (typeof o === "string")
    return o;
  if (typeof o === "object" && o instanceof ObjectId)
    return String(o);
  if (typeof o === "object" && o && o.id) // null is an object
    return DB.toStringId(o.id);
  return null;
};

DB.toObjectId = function (o) {
  var stringId = DB.toStringId(o);
  if (stringId)
    return new ObjectId(stringId);
  return null;
};

DB.Id = {
  eq : function (idA, idB) { return DB.toStringId(idA) === DB.toStringId(idB) },
  neq: function (idA, idB) { return DB.toStringId(idA) !== DB.toStringId(idB) }
};

// global db helpers

/*
  * Saving one or multiple documents
  *
  * ex:
  *   var playerA = new DB.Model.Player({ "name" : "vincent" });
  *   var playerB = new DB.Model.Player({ "name" : "marc" });
  *   DB.saveAsync(playerA).then(...)
  *   DB.saveAsync([playerA, playerB]).then(...)
  */
DB.save = function (docs) {
  if (Array.isArray(docs))
    return Q.all(docs.map(function (doc) { return DB.save(doc) }));
  return Q.ninvoke(docs.save);
};

// @param model DB.Model.*
// @param ids  ["id",..] or [{id:..}] or {id:} or "id"
// @return Promise(true/false)
DB.existOrEmpty = curry(function (model, ids) {
  if (!ids || Array.isEmptyArray(ids))
    return Q(true);
  return DB.exist(model, ids);
});

// @param model DB.Model.*
// @param ids  ["id",..] or [{id:..}] or {id:} or "id"
// @return Promise(true/false)
DB.exist = curry(function (model, ids) {
  ids = (Array.isArray(ids)) ? ids : [ ids ];
  ids = ids.map(DB.toStringId);
  return Q.ninvoke(model, "count", { _id: { $in: ids }})
          .then(function (n) { return n === ids.length });
});

// @param model   DB.Model.*
// @param unused  just here to enable currying
// @return Promise(model)
DB.getRandomModel = curry(function (model, unused) {
  return Q.ninvoke(model, "count", {})
          .then(function (n) {
            var randomIndex = Math.floor(Math.random() * n);
            var query = model.find({}).skip(randomIndex).limit(1);
            return Q.ninvoke(model, "exec")
                    .then(function (result) { return result[0]; });
          });
});

DB.findById = curry(function (model, id) {
  return Q.ninvoke(model, 'findById', id);
});

//
// FIXME: ce chargement est bof (arbre de dépendance resolu manuellement)
//  peut être faudrait il intégrer https://github.com/jrburke/amdefine
//

// mongoose data
DB.Definitions = require('./db/definitions.js');
DB.Schemas = require('./db/schemas.js');
DB.Models = require('./db/models.js')

// generating schemas
DB.Schemas.generate(DB);
// generating models
DB.Models.generate(DB);

// random api
if (Conf.env === "DEV") {
  DB.Model.Club.randomAsync = function () { return DB.getRandomModelAsync(DB.Model.Club); };
  DB.Model.Player.randomAsync = function () { return DB.getRandomModelAsync(DB.Model.Player); };
  DB.Model.Game.randomAsync = function () { return DB.getRandomModelAsync(DB.Model.Game); };
  DB.Model.Team.randomAsync = function () { return DB.getRandomModelAsync(DB.Model.Team); };
}

module.exports = DB;
