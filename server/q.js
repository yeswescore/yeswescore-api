var Q = require('q');

Q.makePromise.prototype.ensure = function (func, params) {
  var that = this;
  return {
    is: function (val, message) {
      return that.then(Q.nfapply(func, params))
                 .then(function (result) {
                    if (result !== val)
                      throw (message || "ensure is "+val+" failed");
                    return result;
                  });
    },

    isNot: function (val, message) {
      return that.then(Q.nfapply(func, params))
                 .then(function (result) {
                    if (result === val)
                      throw (message || "ensure is "+val+" failed");
                    return result;
                  });
    }
  }
};

// FIXME: .inject(func, param, ...).into(data, field)

module.exports = Q;