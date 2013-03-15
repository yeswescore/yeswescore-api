var https = require('https')
  , Q = require('q');
  
// wrapping https api with Q.
var myHttps = {
  /*
   * var https = require('./https');
   * https.getAsync({host: ..., port: ..., path: ...})
   *      .then(function (data) { console.log(data); },
   *            function (e) { console.log('error : ' + e); });
   */
  getAsync : function (options) {
    var deferred = Q.defer();
    https.get(options, function (res) {
      var data = "";
      res.on("data", function (chunk) { data += chunk })
         .on("end", function () {
          deferred.resolve(data);
      });
    }).on("error", function (e) {
      deferred.reject(e);
    });
    return deferred.promise;
  }
};

module.exports = myHttps;