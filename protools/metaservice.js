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

var _ = require('underscore');
var utils = require('../utils');
var log = utils.log();


module.exports = function(opts) {

  return (function(req, res, next) {
    // Promise trigger

    var params = {}
    for (var param in opts) {
      params[param] = eval(opts[param]);
    }

    var start = Promise.resolve(params);
    // Queue every promise from parent arguments
    for (var i=1;i<this.length;i++) {
      if (typeof this[i] === 'function') {
        start = start.then(this[i]);
      }
    }

    start
    .then(function(data) {
      res.json(data);
    })
    .catch(function(err) {
      log.error(err);
      res.status(400).json(err);
    })
  }).bind(arguments);
}
