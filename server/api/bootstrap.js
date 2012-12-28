var Conf = require("../conf.js"),
    app = require("../app.js");

/*
* client will call :
* /bootstrap/conf.json?version=xx.xx.xx.xx to get a new dynamic configuration.
*/
app.get('/bootstrap/conf.json', function(req, res){
  var conf;
  var latest = "0.0.0.1";

  switch (req.query.version) {
    default:
      var baseUrl = "http://"+Conf.get("http.host")+":"+Conf.get("http.port")+"/";
      
      conf = [
        { key: 'version.latest', value: latest, metadata: {} },
        { key: 'bootstrap.update_interval', value: 24 * 3600 * 1000, metadata: {} }, // every day
        { key: 'api.games', value: baseUrl+Conf.get("api.games"), metadata: {} },
        { key: 'api.players', value: baseUrl+Conf.get("api.players"), metadata: {} },
        { key: 'api.clubs', value: baseUrl+Conf.get("api.clubs"), metadata: {} }
      ];
      break;
  }
  // 
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(conf));
});