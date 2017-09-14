'use strict';

// Javi Magic: Class constructor with parameters [and custom method]
/*
  Receives:
    Cls: Class Reference
    arguments: Params for Cls constructor
    [method]: Optional, name

*/
var newC = (function(Cls) {
  if (Cls in this) {
    Cls = this[Cls];
  }
  else {
    throw new Error(Cls + ' not found');
  }

  var _method = arguments[arguments.length-1];
  var newObj = new (Function.prototype.bind.apply(Cls, arguments));
  if (_method) {
    if (_method in Cls.prototype) {
      return (Cls.prototype[_method]).bind(newObj);
    }
  }
  return newObj;
}).bind(global);

module.exports = newC;