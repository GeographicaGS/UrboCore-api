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

var adminValidators = require('./admin/validators');
// var VariablesModel = require('../models/variablesmodel');
var utils = require('../utils');
// var log = utils.log();


var exports = {
  validRanges: function(ranges, scope, variable) {

    return Promise.resolve();
    /*
    if (ranges==='all') {
      return Promise.resolve();

    } else {
      if (Array.isArray(ranges)) {
        var model = new VariablesModel();
        return model.getRangesForVariable(scope, variable)
          .then(function(fullranges) {
            // TODO: Handle existent ranges with range
            log.debug(fullranges);
            return Promise.resolve();

          })
          .catch(function(err) {
            log.error(err);
            return Promise.reject();
          });
      }
      return Promise.reject();
    }
    */
  },
  validColumns: function(filters) {
    return true
  },
  requiredField: function(filters, requirement) {
    return (typeof requirement !=='undefined');
  },
  validDailyStep: function(step) {
    return ['1h','2h','4h','6h','8h','12h'].indexOf(step) > -1;
  },
  isObject: function(value) {
    return value.constructor === {}.constructor;
  },
  isNumber: function(value) {
    return !isNaN(value);
  }
}

Object.assign(exports, adminValidators);

module.exports = exports;
