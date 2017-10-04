// Copyright 2017 Telefónica Digital España S.L.
// 
// This file is part of UrboCore API.
// 
// UrboCore API is free software: you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// UrboCore API is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
// General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with UrboCore API. If not, see http://www.gnu.org/licenses/.
// 
// For those usages not covered by this license please contact with
// iot_support at tid dot es

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