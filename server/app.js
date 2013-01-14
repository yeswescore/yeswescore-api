var express = require("express")
  , app = express();

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
      console.log('startsWith ? ' + populatePath+"." + " Vs " + field);
      return field.startsWith(populatePath+".");
    }).map(function (field) {
          console.log("mapped: "+field.replace(populatePath+".", ""));
      return field.replace(populatePath+".", "");
    }).join(" ");
    if (result[populatePath] === "")
      result[populatePath] = null; // <=> no specific fields
  });
  return result;
};

module.exports = app;