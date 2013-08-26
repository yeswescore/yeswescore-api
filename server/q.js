var Q = require('q');

Q.wrap = function (val) {
  return Q.fcall(function () { return val });
};

Q.makePromise.prototype.ensure = function (promise) {
  var that = this;
  return {
    is: function (val, message) {
      return that.then(promise)
                 .then(function (result) {
                    if (result !== val)
                      throw (message || "ensure is "+val+" failed");
                    return result;
                  });
    },

    isNot: function (val, message) {
      return that.then(promise)
                 .then(function (result) {
                    if (result === val)
                      throw (message || "ensure is "+val+" failed");
                    return result;
                  });
    }
  }
};

Q.ensure = function (func, params) {
  return Q.wrap(null).ensure(func, params);
};


Q.makePromise.prototype.inject = function (obj, field) {
  return that.then(function (r) { obj[field] = r; return r; });
};

module.exports = Q;