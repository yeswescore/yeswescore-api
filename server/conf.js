var env = process.env.NODE_ENV || 'DEV'
  , Conf = {};
  
if (env === "DEV") {
  // Default Urls:
  //  http://plic.no-ip.org:20080/   api vN, vN-1 (proxy) <= The client should use this URL.
  //  http://plic.no-ip.org:28080/   api vN
  //  http://plic.no-ip.org:28079/   api vN-1
  //  http://plic.no-ip.org:10443/   facebook (unused)
  //  http://plic.no-ip.org:10080/   www (proxy)          <= The website should use this URL
  //  http://plic.no-ip.org:18080/   www static
  Conf = {
    "http.host" : "91.121.184.177",
    "http.port" : parseInt(process.env.YESWESCORE_PORT, 10) || "28080",
    "api.games" : "/v2/games/",
    "api.players" : "/v2/players/",
    "api.clubs" : "/v2/clubs/",
    "api.files" : "/v2/files/",
    "api.auth": "/v2/auth/",
    "api.facebook": "/v2/facebook/",
    "api.email": "/v2/email/",
    "api.report": "/v2/report/",
    "api.teams" : "/v2/teams/",
    "default.language": "en",
    "documents.games": "/documents/games/",
    "documents.players": "/documents/players/",
    "documents.clubs": "/documents/clubs/",
    "documents.teams": "/documents/teams/",
    "email.send.confirmation" : false,
    "email.from.email": "noreply@yeswescore.com",
    "email.from.name": "paperboy",
    "email.mandrill.key": "##############", // @see https://mandrillapp.com/settings/index/
    "email.mandrill.host": "mandrillapp.com",
    "email.mandrill.path.messages.send": "/api/1.0/messages/send.json",
    "push.urbanairship.key": "##############",
    "push.urbanairship.secret": "##############",
    "push.urbanairship.master": "##############",     
    "facebook.app.id": (process.env.USER === "syndr0m") ? "618522421507840" : "408897482525651",
    "facebook.app.secret": (process.env.USER === "syndr0m") ? "##############" : "##############",
    "facebook.graph.host": "graph.facebook.com",
    "facebook.graph.port": "443",
    "facebook.logs.path": "/home/"+process.env.USER+"/tmp/yeswescore-facebook/",
    "facebook.yws.scheme": "http",
    "facebook.yws.host": "plic.no-ip.org",
    "facebook.yws.port": parseInt(process.env.YESWESCORE_FACEBOOK_PORT, 10) || "10443",
    "static.path": "/home/"+process.env.USER+"/tmp/static/",
    "files.path": "/home/"+process.env.USER+"/tmp/static/files/",
    "mongo.url": "mongodb://localhost/dev",
    "security.secret": "de analysi per aequationes numero terminorum infinitas",
    "logs.path": "/home/"+process.env.USER+"/tmp/yeswescore-api/",
    // app www
    "www.logs.path": "/home/"+process.env.USER+"/tmp/yeswescore-www/",
    "www.http.proxy.targethost": "localhost",
    "www.http.proxy.host": "plic.no-ip.org",
    "www.http.proxy.port": parseInt(process.env.YESWESCORE_WWW_PORT, 10) || "10080",
    "www.http.static.host": "plic.no-ip.org",
    "www.http.static.port": (parseInt(process.env.YESWESCORE_WWW_PORT, 10)  + 1) || "18080",
    // app proxy
    "proxy.logs.path": "/home/"+process.env.USER+"/tmp/yeswescore-proxy/",
    "proxy.http.targethost": "localhost",
    "proxy.http.host": "plic.no-ip.org",
    "proxy.http.port.api.v1": (parseInt(process.env.YESWESCORE_PORT, 10) - 1) || "28079",
    "proxy.http.port.api.v2": parseInt(process.env.YESWESCORE_PORT, 10) || "28080",
    "proxy.http.port.api.default": parseInt(process.env.YESWESCORE_PORT, 10) || "28080",
    "proxy.http.port": parseInt(process.env.YESWESCORE_PROXY_PORT, 10) || "20080"
  };
  
  Conf["mongo.url"] += Conf["http.port"]; // database name depends of port number
} else {
  Conf = {
    "http.host" : "api.yeswescore.com",
    "http.port" : "7002", // 7000 + version api.
    "https.port": "443",
    "api.games" : "/v2/games/",
    "api.players" : "/v2/players/",
    "api.clubs" : "/v2/clubs/",
    "api.files" : "/v2/files/",
    "api.connections": "/v2/facebook/",
    "api.email": "/v2/email/",
    "api.report": "/v2/report/",
    "api.teams" : "/v2/teams/",
    "default.language": "en",
    "email.from.email": "noreply@yeswescore.com",
    "email.from.name": "paperboy",
    "email.mandrill.key": "##############", // @see https://mandrillapp.com/settings/index/
    "email.mandrill.host": "mandrillapp.com",
    "email.mandrill.path.messages.send": "/api/1.0/messages/send.json",
    "push.urbanairship.key": "##############",
    "push.urbanairship.secret": "##############",
    "push.urbanairship.master": "##############",        
    "facebook.app.id": "447718828610668",
    "facebook.app.secret": "##############",
    "facebook.graph.host": "graph.facebook.com",
    "facebook.graph.port": "443",
    "facebook.logs.path": "/var/log/yeswescore-facebook/",
    "facebook.yws.scheme": "https",
    "facebook.yws.host": "fb.yeswescore.com",
    "facebook.yws.port": "443",
    "static.path": "/home/node/static/",
    "files.path": "/home/node/static/files/",
    "mongo.url": "mongodb://localhost/prod",
    "security.secret": "de analysi per aequationes numero terminorum infinitas",
    "logs.path": "/var/log/yeswescore-api/",
    // app www
    "www.logs.path": "/var/log/yeswescore-www/",
    "www.http.proxy.targethost": "localhost",
    "www.http.proxy.host": "www.yeswescore.com",
    "www.http.proxy.port": "80",
    "www.http.static.host": "www.yeswescore.com",
    "www.http.static.port": "8000",
    // app proxy
    "proxy.logs.path": "/var/log/yeswescore-proxy/",
    "proxy.http.targethost": "localhost",
    "proxy.http.host": "api.yeswescore.com",
    "proxy.http.port.api.v1": "7001",
    "proxy.http.port.api.v2": "7002",
    "proxy.http.port.api.default": "7002",
    "proxy.http.port": "7000"
  };
}

// overloading http.port
//process.argv.forEach(function (val, index, array) {
//  console.log(index + ': ' + val);
//});

Conf["env"] = env;
Conf.get = function (o) { return Conf[o] };
Conf.getAbsoluteUrl = function (relative) {
  var absoluteUrl = "http://"+Conf.get("http.host");
  if (parseInt(Conf.get("http.port"), 10) !== 80)
    absoluteUrl += (":"+Conf.get("http.port"));
  return absoluteUrl + relative;
};

module.exports = Conf;
