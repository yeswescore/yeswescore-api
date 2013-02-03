var assert = require("assert");

var isObject = function (s) { return typeof s === "object" && s !== null };
var isString = function (s) { return typeof s === "string" };
var isHexa = function(s) { return s.match(/^[0-9a-f]+$/) };
var isNumber = function(s) { 
  if (!String(s).match(/^[0-9\-\.]+$/))
    return false;
  return parseInt(s, 10) !== NaN;
};
var isNotNull = function (s) { return s !== null };
var isNotEmpty = function (s) {
  if (typeof s === "string" && s.length === 0)
    return false;
  return isNotNull(s);
};
var isArray = function (s) { return Array.isArray(s) };
var isDate = function (s) {
  return (isString(s) && isNotEmpty(s)) || s === null; /* FIXME */
};

var isId = function (id, m) {
  return isString(id) && isNotEmpty(id) && isHexa(id);
};

assert.isObject = function (s, m) {
  assert(isObject(s), m);
};

assert.isString = function (s, m) {
  assert(isString(s), m);
};

assert.isArray = function (s, m) {
  assert(isArray(s), m);
};

assert.isNumber = function (s, m) {
  assert(isNumber(s), m+" > isNumber: s must be a number (s="+s+")");
};

assert.isHexa = function (s, m) {
  assert(isString(s), m+" > isHexa: s must be a string");
  assert(isHexa(s), m+" > isHexa: s must be hexa");
};

assert.isNotEmpty = function (s, m) {
  assert(isNotEmpty(s), m+"isNotEmpty: cannot be empty string");
};

assert.isId = function (id, m) {
  assert.isString(id, m+" > isId: must be a string");
  assert.isNotEmpty(id, m+" > isId: cannot be empty");
  assert.isHexa(id, m+" > isId: must be hexa ("+id+")");
};

assert.isNullableString = function (s, m) {
  assert(isString(s) || s === null, m+" >isNullableString: must be null or string");
};

assert.isUndefinedOrString = function (s, m) {
  assert(typeof s === "undefined" || typeof s === "string", m+" >isUndefinedOrString: must be undefined or string");  
};

assert.isUndefinedOrNullableString = function (s, m) {
  assert(typeof s === "undefined" || typeof s === "string" || s === null, m+" >isUndefinedOrString: must be undefined or string");  
};

assert.isUndefinedOrArray = function (s, m) {
  assert(typeof s === "undefined" || isArray(s), m);
};

assert.isUndefinedOrDate = function (s, m) {
  assert(typeof s === "undefined" || isDate(s), m);
};

assert.isUndefinedOrId = function (s, m) {
  if (typeof s === "undefined") return;
  assert.isId(s, m);
};

assert.isDate = function (s, m) {
  assert(isDate(s), m);
};

assert.isPos = function (s, m) {
  assert(Array.isArray(s), m+" >isPos: must be an array (index 2d)");
};

assert.isUndefinedOrPos = function (s, m) {
  if (typeof s === "undefined") return;
  assert.isPos(s, m);
};


assert.allowedFields = function (o, fields, m) {
  for (var i in o) {
    assert(fields.indexOf(i) !== -1, m+" >allowedFields "+i+" is not allowed");
  }
};

// assert that obj validate schema
// /!\ ONLY HANDLING DOUBLE TYPE undefined|other
assert.schema = function (schema, obj, msg) {
  assert(typeof obj !== "undefined", msg+" obj can't be undefined");

  var keys = Object.keys(schema);
  keys.forEach(function (k) {
    if (k[0] == "_")
      return; // private schema option.
    var value = schema[k];
    // recursive validation
    if (typeof value._type === "undefined" && typeof value === "object" && value)
    {
      // sub object, recursive analysis if mandatory & not undefined
      if (typeof obj[k] === "undefined" && !value._mandatory) {
        return; // not mandatory field => can be undefined.
      }
      assert(typeof obj[k] !== "undefined", msg + " field " + k + " should be Defined (mandatory!)");
      return assert.schema(value, obj[k], msg + k + ".");
    }
    // malformed schema ?
    if (typeof value._type !== "string")
      assert(false, "malformed UT schema on key : " + k + " typeof key._type is " + typeof value._type + " but should be string ! (msg=" + msg + ")");

    // CHECKING KEY: can be undefined ?
    var types = value._type.split("|");
    if (types.indexOf("undefined") === -1) {
      assert(typeof obj[k] !== "undefined", msg+" "+k+" can't be undefined");
    } else if (typeof obj[k] === "undefined") {
      return; // undefined is allowed
    }
    
    // removing undefined
    var type = types.filter(function (t) { return t != "undefined" }).join();
    
    // CHECKING VALUE:
    switch (type) {
      case "id":
        assert.isId(obj[k], msg + " field " + k + " should be an id");
        break;
      case "date":
        assert.isDate(obj[k], msg + " field " + k + " should be an date");
        break;
      case "array":
        assert.isArray(obj[k], msg + " field " + k + " should be an array");
        break;
      case "string":
        assert.isString(obj[k], msg + " field " + k + " should be an string");
        break;
      case "number":
        assert.isNumber(obj[k], msg + " field " + k + " should be an number");
        break;
      case "enum":
        assert(Array.isArray(value._enum), msg + " malformed schema : enum on field " + k);
        assert(value._enum.indexOf(obj[k]) !== -1, msg + " field " + k + " value = " + obj[k] + " is not in enum");
        break;
      case "pos":
        assert.isPos(obj[k], msg + " field " + k + " should be an pos");
        break;
      case "[schema]":
        assert(typeof value._check === "function", msg + " malformed schema : [schema] on field " + k + " : _check should exist & be a function");
        assert(Array.isArray(obj[k]), msg + " field " + k + " should be an array of subschemas");
        obj[k].forEach(value._check);
        break;
      case "check":
        assert(typeof value._check === "function", msg + " malformed schema : check on field " + k);
        value._check(obj[k]);
        break;
      default:
        assert(false, msg + " malformed schema : " +value._type + " is unknown on field " + k);
        break;
    }
  });
  // a l'inverse
  var keys =  Object.keys(obj);
  keys.forEach(function (k) {
    if (typeof schema[k] === "undefined")
      assert(false, msg + " unallowed field " + k + " in schema");
  });
}


assert.isClub = function (club) {
  assert.schema({
    id: { _type: "id" },
    sport: { _type: "enum", _enum: [ "tennis" ] },
    dates: {
      creation: { _type: "date" },
      update: { _type: "date" }
    },
    name: { _type: "string|undefined" },
    location : {
      city: { _type: "string|undefined" },
      address: { _type: "string|undefined" },
      pos: { _type: "pos|undefined" }
    },
    fftid: { _type: "string|undefined" },
    ligue: { _type: "string|undefined" },
    zip: { _type: "string|undefined" },
    outdoor: { _type: "number|undefined" },
    indoor: { _type: "number|undefined" },
    countPlayers: { _type: "number|undefined" },
    countPlayers1AN: { _type: "number|undefined" },
    countTeams: { _type: "number|undefined" }, 
    countTeams1AN: { _type: "number|undefined" }, 
    school: { _type: "string|undefined" }
  }, club, "isClub: ");
};

assert.isPlayerScheme = function (player, m) {
  assert.schema({
    id: { _type: "id" },
    nickname: { _type: "string|undefined" },
    name: { _type: "string|undefined" },
    location: {
      currentPos: { _type: "array|undefined" }
    },
    dates: {
      creation: { _type: "date" },
      update: { _type: "date" }
    },
    email: { _type: "string|undefined" },
    idlicense: { _type: "string|undefined" },
    rank: { _type: "string|undefined" },
    token: { _type: "string|undefined" },
    owner: { _type: "id|undefined" },
    club: { _type: "undefined|check", _check: function (value) {
        assert(typeof value === "object", "isPlayerScheme: club must be null or object");
        assert.isId(value.id, "isPlayerScheme: club.id must be an id");
      }
    },
    type: { _type: "enum|undefined", _enum: [ "default", "owned" ] },
    games: { _type: "[schema]", _check: function (gameid, i, games) {
        assert.isId(gameid, "isPlayerScheme: games[*] must be id");
      }
    },
  }, player, "isPlayerScheme: ");
};

assert.isPlayer = function (player) {
  assert.isPlayerScheme(player, "isPlayer: must be a player");
  assert(typeof player.token === "undefined", "isPlayer: token must be undefined");
  assert(typeof player.password === "undefined", "isPlayer: password must be undefined");
};

assert.isPlayerWithToken = function (player) {
  assert.isPlayerScheme(player, "isPlayerWithToken: must be a player");
  assert.isId(player.token, "isPlayerWithToken: token must be an hexa string");
};

assert.isGame = function (game) {
  assert.schema({
    id : { _type: "id" },
    sport: { _type: "enum", _enum: [ "tennis" ] },
    owner: { _type: "id" },
    status: { _type : "enum|undefined", _enum: ["ongoing", "finished", "canceled" ] },
    dates: {
      creation: { _type: "date" },
      update:  { _type: "date|undefined" },
      start: { _type: "date|undefined" },
      end: { _type: "date|undefined" }
    },
    location: {
      country : { _type : "string|undefined" },
      city: { _type: "string|undefined" },
      pos: { _type: "pos" }
    },
    options: {
      type: { _type: "enum", _enum: ["singles"] },
      subtype: { _type: "undefined|enum", _enum: [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ] },
      sets: { _type: "undefined|string" },
      score: { _type: "undefined|string" },
      court: { _type: "undefined|enum", _enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
                                                "A", "B", "C", "D", "E", "F", "" ] },
      surface: { _type: "undefined|enum", _enum: ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ", 
                                                  "NVTB", "PAR", "RES", "TB", "" ] },
      tour: { _type: "undefined|string" }
    },
    teams: { _type: "[schema]", _check: function (team, i, teams) {
        assert(teams.length === 2, "isGame: game must have 2 teams");
        assert.isGameTeam(team)
      } 
    },
    stream: { _type: "undefined|[schema]", _check: function (streamItem, i, stream) {
        assert.isStreamComment(streamItem);
      }
    },
  }, game, "isGame: ");
};

assert.isGameTeam = function (o, m) {
  assert.schema({
    id: { _type: "id|undefined" },
    points: { _type: "string|undefined" },
    players: { _type: "[schema]", _check: function (player, i, players) {
        assert(players.length === 1, "isGameTeam: only singles are handle yet");
        // player can be a simple ObjectId
        // or an object depending if populate=teams.players was activated
        if (isId(player) || (isObject(player) && isId(player.id))) {
          // ok
        } else {
          assert(false, "isGameTeam: team.players[*] mut be player ids");
        }
      }
    }
  }, o, "isGameTeam: ");
};

assert.isStreamObject = function (o, m) {
  assert.schema({
    id: { _type: "id" },
    type: { _type: "enum", _enum: [ "comment" ] },
    fbid: { _type: "string|undefined" },
    dates: {
      creation: { _type: "date" },
      update: { _type: "date" }
    },
    owner: { _type: "id" },
    data: { _type: "check", _check: function (data) {
        assert.isObject(data, "isStreamObject: streamObject.data must be an object");
      }
    },
  }, o, "isStreamObject ");
};

assert.isStreamComment = function (comment) {
  assert.isStreamObject(comment, "must be a stream object");
  assert(comment.type === "comment", "isStreamComment: streamObject.type must === comment");
  assert.isString(comment.data.text, "isStreamComment: streamObject.data.text must be a string");
};


assert.isError = function (error, m) {
  assert.isObject(error, "error must be an object");
  assert(typeof error.error === "string", "must have error field");
};

module.exports = assert;