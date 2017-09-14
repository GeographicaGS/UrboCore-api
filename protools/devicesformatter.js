'use strict';

var _ = require('underscore');
var utils = require('../utils');
var BaseFormatter = require('./baseformatter');
var log = utils.log();


class DevicesFormatter extends BaseFormatter {

  constructor() {
    super();
  }

  rawData(results) {

    var rslts = [];
    results.forEach(function(rslt) {
      rslts.push(rslt.rows);
    });
    if (rslts.length === 1) {
      rslts = rslts[0];
    }
    else {
      rslts = _.union(_.flatten(rslts));
    }
    return Promise.resolve(rslts);
  }

}

module.exports = DevicesFormatter;
