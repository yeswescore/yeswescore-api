var http = require("http")
  , assert = require("assert");

var debug = false;

http.is302OK = function (options, f) {
  options.agent = false;
  http.get(options, function (res) {
    assert.equal(res.statusCode, 302);
    if (typeof f === "function")
      f(res);
  }).on("error", function (e) { throw e });
};

// simple high level funcs
http.is200OK = function (options, f) {
  options.agent = false;
  http.get(options, function (res) {
    assert.equal(res.statusCode, 200);
    if (typeof f === "function")
      f();
  }).on("error", function (e) { throw e });
};

http.is404OK = function (options, f) {
  options.agent = false;
  http.get(options, function (res) {
    assert.equal(res.statusCode, 404);
    if (typeof f === "function")
      f();
  }).on("error", function (e) { throw e });
};

// 
http.getJSON = function (options, f) {
  if (debug) {
    console.log('http: GET: ' + options.path);
  }
  options.agent = false; // @see http://stackoverflow.com/questions/15909884/sockets-dont-appear-to-be-closing-when-using-node-js-http-get
  http.get(options, function (res) {
    var json = "";
    res.on("data", function (chunk) { json += chunk })
       .on("end", function () {
          try {
            if (debug) {
              console.log('http: GET: ' + options.path + ' result');
              console.log(json);
            }
            var data = JSON.parse(json);
            f(data, res);
          } catch (e) {
            assert(false, "invalid json ("+e+") = "+json);
          }
        });
  }).on("error", function (e) { throw e });
};

http.post = function (options, data, f) {
  if (debug) {
    console.log('=> http: POST: ' + options.path + ' data ' + JSON.stringify(data));
  }
  // node default querystring.stringify doesn't handle nested objects.
  // we post using Content-Type: application/json.
  // If we used Content-Type: application/x-www-form-urlencoded
  //   we should have qs.stringify(data).
  //   but we would have transfered "null" as string !
  data = JSON.stringify(data);//qs.stringify(data);
  // extending options [oldSchool]
  var postOptions = { 
    method : "POST",
    headers : {
      'Content-Type': 'application/json'
  //, 'Content-Length': data.length // Sending a 'Content-length' header will disable the default chunked encoding.
    }
  };
  for (var i in options) {
    postOptions[i] = options[i];
  }
  var req = http.request(postOptions, function(res) {
    var json = "";
    res.on("data", function (chunk) { json += chunk })
       .on("end", function () {
          try {
            if (debug) {
              console.log('<= http: POST: ' + options.path + ' result');
              console.log(json);
            }
            var data = JSON.parse(json);
            f(data, res);
          } catch (e) {
            assert(false, "invalid json ("+e+") = "+json);
          }
        });
  });
  req.on("error", function (e) { throw e });
  req.write(data);
  req.end();
};

module.exports = http;