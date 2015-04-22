var Conf = require("../conf.js"),
    app = require("../app.js"),
    DB = require("../db.js");

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

      /* On affiche le dernier code saisi dans l'admin */
      conf = [
        { key: 'version.latest', value: latest, metadata: {} },
        { key: 'bootstrap.update_interval', value: 24 * 3600 * 1000, metadata: {} }, // every day
        { key: 'fr.speedbadminton.promo.merchant', value: 'DECATHLON', metadata: {} },
        { key: 'fr.speedbadminton.promo.code', value: 'DECA1022YWSSPEED', metadata: {} },
        { key: 'fr.speedbadminton.promo.desc', value: '10% de réduction sur tout le site', metadata: {} },
        { key: 'fr.speedbadminton.promo.img', value: '', metadata: {} },
        { key: 'fr.speedbadminton.promo.width', value: '100', metadata: {} },
        { key: 'fr.speedbadminton.promo.height', value: '100', metadata: {} },
        { key: 'fr.tennis.promo.merchant', value: 'DECATHLON', metadata: {} },
        { key: 'fr.tennis.promo.code', value: 'DECA1022YWSTENNIS', metadata: {} },
        { key: 'fr.tennis.promo.desc', value: '10% de réduction sur tout le site', metadata: {} },
        { key: 'fr.tennis.promo.img', value: '', metadata: {} },
        { key: 'fr.tennis.promo.width', value: '100', metadata: {} },
        { key: 'fr.tennis.promo.height', value: '100', metadata: {} }
      ];

      break;
  }
  // 
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(conf));
});
