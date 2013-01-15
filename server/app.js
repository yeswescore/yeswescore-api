var express = require("express")
  , app = express();

var routes = { /* "/v1/games/:id" : function (req, res) { ... } */ };
app.get = (function (oldGet) {
  return function () {
    if (typeof arguments[1] === "function")
      routes[arguments[0]] = arguments[1];
    if (typeof arguments[2] === "function")
      routes[arguments[0]] = arguments[2];
    oldGet.apply(app, arguments);
  }
})(app.get);

app.internalRedirect = function (route) {
  return routes[route];
}
  
app.defaultError = function (res, msg) { 
  return function (err) { res.end(JSON.stringify({error:err, message:msg})); };
};

// @return { 'select' : fields, 'populate1': fields, ... }
app.createPopulateFields = function (fields, populate) {
  var populate = populate || "";
  var populatePaths = populate.split(",");
  var fields = fields || "";
  var fieldsPath = fields.split(",");
  var l = populatePaths.length;
  var result = {};
  result.select = fieldsPath.filter(function (field) {
    for (var i = 0; i < l; ++i) {
      if (field.startsWith(populatePaths[i]+".")) {
        return false;
      }
    }
    return true;
  }).join(" ");
  // every other fields
  populatePaths.forEach(function (populatePath) {
    result[populatePath] = fieldsPath.filter(function (field) {
      return field.startsWith(populatePath+".");
    }).map(function (field) {
      return field.replace(populatePath+".", "");
    }).join(" ");
    if (result[populatePath] === "")
      result[populatePath] = null; // <=> no specific fields
  });
  return result;
};

module.exports = app;