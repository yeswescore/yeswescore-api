var assert = require("assert");

var isObject = function (s) { return typeof s === "object" && s !== null };
var isString = function (s) { return typeof s === "string" };
var isHexa = function(s) { return s.match(/^[0-9a-f]+$/) };
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

assert.isObject = function (s, m) {
  assert(isObject(s), m);
};

assert.isString = function (s, m) {
  assert(isString(s), m);
};

assert.isArray = function (s, m) {
  assert(isArray(s), m);
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

/*
 * accepted club object:
  {
    id: "dccc9614c8c15aa5c713a457",
    sport: "tennis",
    name: "LOUVIGNY TC",
    city: "Lisieux"
  }
*/
assert.isClub = function (club) {
  assert.isObject(club, "isClub: club must be an object");
  // mandatory
  assert.isId(club.id, "isClub: id must be an hexa string");
  // optionnals
  assert.isUndefinedOrString(club.sport, "isClub: sport");
  assert.isUndefinedOrString(club.name, "isClub: name");
  assert.isUndefinedOrString(club.city, "isClub: city");
  assert.isUndefinedOrDate(club.date_creation, "isClub: date_creation");
  assert.allowedFields(club, ["id", "sport", "name", "city", "date_creation"]);
};

/*
 * accepted player object:
  {
    id: "a5977c38a2955cd64b93d658",
    nickname: "FenetrePVC",
    name: "Clarisse Torrès",
    rank: "15/2",
    club: {
      id: "8d0d2d0a3ae211e7b949f6c1",
      name: "CAEN TC"
    },
    games: [
      "dc25289a4d60ed79f3fdce30",
      "426e0a588c98c010c9b8d17c"
    ],
    password: null,
    token: "8871617"
  }
*/
assert.isPlayerScheme = function (player, m) {
  assert.isObject(player, "isPlayerScheme: player must be an object");
  // mandatory
  assert.isId(player.id, "isPlayerScheme: id must be an hexa string");
  // token & password can be undefined
  assert.isUndefinedOrString(player.token, "isPlayerScheme: token");
  assert.isUndefinedOrNullableString(player.password, "isPlayerScheme: password");
  // optionnals
  assert.isUndefinedOrString(player.nickname, "isPlayerScheme: nickname");
  assert.isUndefinedOrString(player.name, "isPlayerScheme: name");
  assert.isUndefinedOrDate(player.date_creation, "isPlayerScheme: date_creation");
  assert.isUndefinedOrDate(player.date_modification, "isPlayerScheme: date_modification");
  assert.isUndefinedOrString(player.rank, "isPlayerScheme: rank");
  // owner
  if (player.owner)
    assert.isId(player.owner, "isPlayerScheme: owner must be an id (or null)");
  // club
  assert(typeof player.club === "undefined" || 
         (typeof player.club === "object" && player.club.id), "isPlayerScheme: club must be null or object");
  // type
  assert(typeof player.type === "undefined" ||
         player.type === "default" ||
         player.type === "owned", "isPlayerScheme: type must be undefined, default or owned");
         
  // games
  assert.isUndefinedOrArray(player.games, "isPlayerScheme: games must be an array");
  player.games.forEach(function (gameId) {
    assert.isId(gameId, "isPlayerScheme: games[*] must be id");
  });
  //
  assert.allowedFields(player, ["id", "nickname", "name", "date_creation", "date_modification", "rank", "club", "games", "owner", "password", "token", "type"]);
  // FIXME:
  // - rank format
  // - no password => allowed blank fields
  // - password => unallowed fields ?
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

/*
 * accepted game object:
  {
    id: "e476647a2814cc9bbbf057b5",
    date_creation: "2012-12-28T07:59:05Z",
    date_start: "2012-12-28T07:59:05Z",
    date_end: "2012-12-28T09:27:35Z",
    pos: POS
    country: "france",
    city: "Falaise",
    type: "singles",
    sets: "3/6;2/6",
    score: "",
    sport: "tennis",
    status: "finished",
    stream: [ STREAM_OBJECT, STREAM_OBJECT, ... ],
    teams: [ GAMETEAM, GAMETEAM ]
  }
*/
assert.isGame = function (game) {
  assert.isObject(game, "isGame: game must be an object");
  // mandatory
  assert.isId(game.id, "isGame: id must be an hexa string");
  assert.isId(game.owner, "isGame: owner must be an hexa string");
  assert.isDate(game.date_creation, "isGame: date_creation must be a date");
  assert.isDate(game.date_start, "isGame: date_start must be a date");
  assert.isUndefinedOrDate(game.date_end, "isGame: date_end must be a date");
  assert.isUndefinedOrPos(game.pos, "isGame: pos must be a pos");
  assert.isArray(game.stream, "isGame: stream must be an array");
  // 
  assert.isUndefinedOrString(game.country, "isGame: country");
  assert.isUndefinedOrString(game.city, "isGame: city");
  assert.isUndefinedOrString(game.type, "isGame: type");
  assert.isUndefinedOrString(game.sets, "isGame: sets");
  assert.isUndefinedOrString(game.score, "isGame: score");
  assert.isString(game.sport, "isGame: sport");
  assert.isUndefinedOrString(game.status, "isGame: status");
  //
  assert(game.type === "singles", "isGame: game.type can only be singles");
  assert(game.sport === "tennis", "isGame: game.sport can only be tennis");
  assert(game.status === "finished" ||
         game.status === "ongoing", "isGame: game.status can only be finished or ongoing");
  
  // only stream comment actually
  game.stream.forEach(function (streamObject) {
    assert.isStreamComment(streamObject, "isGame: game can only contain stream comments");
  });
  
  // teams
  assert.isArray(game.teams, "isGame: teams must be an array");
  assert(game.teams.length === 2, "isGame: game must have 2 teams");
  game.teams.forEach(function (team) {
    assert.isGameTeam(team, "isGame: team[*] must be a gameteam");
  });
  
  // FIXME:
  assert.allowedFields(game, ["id", "date_creation", "date_start", "date_end", "owner",
                              "pos", "country", "city", "type", "sets", "score", "sport", "status",
                               "players", "stream", "teams"]);
};

/**
 * accepted teamplayer object
  {
    id: "b79f6e2c83429a8d37a99660"
  }
  or
  {
    name: "..."
  }
*/
assert.isTeamPlayer = function (o, m) {
  assert.isObject(o, "isTeamPlayer: must be an object");
  assert(typeof o.id === "string" || typeof o.name === "string", "isTeamPlayer: must have 'id' or 'name' field");
  if (typeof o.id !== "undefined")
    assert.isId(o.id, "isTeamPlayer: o.id must be an hexa id string");
};

/**
 * accepted gameteam object
  {
    id: null,
    players: [ teamplayer, teamplayer, ... ]
  }
*/
assert.isGameTeam = function (o, m) {
  assert.isObject(o, "isGameTeam: must be an object");
  assert(o.id === null, "isGameTeam: id must be null (no team yet)");
  assert.isArray(o.players, "isGameTeam: players must be an array");
  assert(o.players.length === 1, "isGameTeam: only singles are handle yet");
  assert.isTeamPlayer(o.players[0], "isGameTeam: team.players[0] must be a teamplayer");
};

/**
 * accepted stream object
  {
    id: "f76f0dfbbbabfce6612f5393",
    type: "*",
    date: "2012-12-28T08:02:05Z",
    owner: "439b3a9cb3ae996b68e0ebf2",
    data: { }
  }
*/
assert.isStreamObject = function (o, m) {
  assert.isObject(o, "isStreamObject: o must be an object");
  assert(typeof o.id !== "undefined", "isStreamObject: streamObject.id cannot be undefined");
  assert(typeof o.type !== "undefined", "isStreamObject: streamObject.type cannot be undefined");
  assert(typeof o.date !== "undefined", "isStreamObject: streamObject.date cannot be undefined");
  assert(typeof o.owner !== "undefined", "isStreamObject: streamObject.owner cannot be undefined");
  assert(typeof o.data !== "undefined", "isStreamObject: streamObject.data cannot be undefined");
  assert.isId(o.id, "isStreamObject: streamObject.id must be an hexa string");
  assert.isId(o.owner, "isStreamObject: streamObject.owner must be an hexa string");
  assert.isDate(o.date, "isStreamObject: streamObject.date must be a date");
  assert.isNotEmpty(o.type, "isStreamObject: streamObject.type cannot be empty");
  assert.isObject(o.data, "isStreamObject: streamObject.data must be an object");
};


/**
 * accepted stream comment
  {
    id: "f76f0dfbbbabfce6612f5393",
    type: "comment",
    date: "2012-12-28T08:02:05Z",
    owner: "439b3a9cb3ae996b68e0ebf2",
    data: {
      text: "C'est EXACTEMENT ça, Franchement pour dire ça faut vraiment être d'une mauvaise foi incomparable ou n'y rien connaître au tennis. On peut ne pas aimer Federer mais ne pas reconnaître qu'il fait le show..."
    }
  }
*/
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