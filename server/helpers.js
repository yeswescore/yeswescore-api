// helpers
(function (global) {
  function pad(n){return n<10 ? '0'+n : n}
  // @see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date#Example.3a_ISO_8601_formatted_dates
  Date.prototype.toISO = function () {
    return this.getUTCFullYear()+'-'
        + pad(this.getUTCMonth()+1)+'-'
        + pad(this.getUTCDate())+'T'
        + pad(this.getUTCHours())+':'
        + pad(this.getUTCMinutes())+':'
        + pad(this.getUTCSeconds())+'Z'
  };
  
  Array.prototype.random = function () { return this[Math.floor(Math.random() * this.length)] };
})(this);