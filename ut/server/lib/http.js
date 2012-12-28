var http = require("http")
  , assert = require("assert")
  , qs = require("qs");
   

// simple high level funcs
http.is200OK = function (options, f) {
  http.get(options, function (res) {
    assert.equal(res.statusCode, 200);
    if (typeof f === "function")
      f();
  }).on("error", function (e) { throw e });
};

http.is404OK = function (options, f) {
  http.get(options, function (res) {
    assert.equal(res.statusCode, 404);
    if (typeof f === "function")
      f();
  }).on("error", function (e) { throw e });
};

// 
http.getJSON = function (options, f) {
  http.get(options, function (res) {
    var json = "";
    res.on("data", function (chunk) { json += chunk })
       .on("end", function () {
          try {
            var data = JSON.parse(json);
            f(data, res);
          } catch (e) {
            assert(false, "invalid json ("+e+")");
          }
        });
  }).on("error", function (e) { throw e });
};

http.post = function (options, data, f) {
  // node default querystring.stringify doesn't handle nested objects.
  data = qs.stringify(data);
  // options
  options.method = "POST";
  options.headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': data.length
  };
  var req = http.request(options, function(res) {
    var json = "";
    res.on("data", function (chunk) { json += chunk })
       .on("end", function () {
          try {
            var data = JSON.parse(json);
            f(data, res);
          } catch (e) {
            assert(false, "invalid json ("+e+")");
          }
        });
  });
  req.on("error", function (e) { throw e });
  req.write(data);
  req.end();
};

module.exports = http;