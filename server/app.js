var express = require("express")
  , app = express();

app.defaultError = function (res, msg) { 
  return function (err) { res.end(JSON.stringify({error:err, message:msg})); };
};

module.exports = app;