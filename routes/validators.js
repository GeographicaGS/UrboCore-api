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
