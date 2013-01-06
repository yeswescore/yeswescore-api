// helpers
(function (global) {
  function pad(n){return n<10 ? '0'+n : n}
  // @see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date#Example.3a_ISO_8601_formatted_dates
  Object.defineProperty(
    Date.prototype,
    "toISO",
    {
      enumerable: false,
      value: function () {
        return this.getUTCFullYear()+'-'
          + pad(this.getUTCMonth()+1)+'-'
          + pad(this.getUTCDate())+'T'
          + pad(this.getUTCHours())+':'
          + pad(this.getUTCMinutes())+':'
          + pad(this.getUTCSeconds())+'Z'
      }
    }
  );
  
  // Array
  Object.defineProperty(
    Array.prototype,
    "random",
    {
      enumerable: false,
      value: function () { return this[Math.floor(Math.random() * this.length)] }
    }
  );
  
  Object.defineProperty(
    Array.prototype,
    "remove",
    {
      enumerable: false,
      value: function (e) { return this.splice(this.indexvOf(e), 1) };
    }
  );
})(this);