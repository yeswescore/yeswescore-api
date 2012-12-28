var http = require("http")
  , assert = require("assert")
  , request = require("request"); // @see https://github.com/mikeal/request
   

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
  request.post("http://" + options.host + ":" + options.port + options.path,
    function (e, r, body) {
      if (e)
        throw e;
      try {
        var data = JSON.parse(body);
        f(data);
      } catch (e) {
        assert(false, "invalid json ("+e+")");
      }
    }
  ).form(data);
};

module.exports = http;