var env = process.env.NODE_ENV || 'dev'
  , Conf = {};

if (env === "dev") {
  Conf = {
    "http.host" : "reachtheflow.com",
    "http.port" : "8080",
    "api.games" : "/v1/games/",
    "api.players" : "/v1/players/",
    "api.clubs" : "/v1/clubs/"
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

module.exports = Conf;