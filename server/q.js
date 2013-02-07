var Q = require("q");

Q.if = function (condition, f1, f2) {
  if (condition)
    return Q.fcall(function () { return f1 });
  return Q.fcall(function () { return f2 });
};