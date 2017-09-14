'use strict';

class Promised {
  constructor() {
    this.make_promises();
  }
  make_promises() {
    var methods = Object.getOwnPropertyNames(this.__proto__);
    for (var method of methods) {
      if (method!=='constructor') {
        this['promised_' + method] = (function() {
          return Promise.resolve(this[method](arguments));
        }).bind(this);
      }
    }
  }
}

module.exports = Promised;
