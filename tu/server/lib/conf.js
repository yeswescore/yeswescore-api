var env = process.env.NODE_ENV || 'DEV'
  , Conf = {};

if (env === "DEV") {
  Conf = {
    "http.host" : "reachtheflow.com",
    "http.port" : "8081",
    "api.games" : "/v1/games/",
    "api.players" : "/v1/players/",
    "api.clubs" : "/v1/clubs/",
    "documents.games": "/documents/games/",
    "documents.players": "/documents/players/",
    "documents.clubs": "/documents/clubs/",
  };
} else {
  Conf = {
    "http.host" : "api.zescore.com",
    "http.port" : "80",
    "api.games" : "/v1/games/",
    "api.players" : "/v1/players/",
    "api.clubs" : "/v1/clubs/"
  };
}

Conf["env"] = env;
Conf.get = function (o) { return Conf[o] };

module.exports = Conf;