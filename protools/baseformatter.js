'use strict'

var utils = require('../utils');
var Promised = require('./promised');
var _ = require('underscore');
var log = utils.log();

class BaseFormatter extends Promised {

  constructor() {
    super();
  }

  pipe(data) {
    return data;
  }

  firstRowFromResults(data) {
    try {
      return data.results[0].rows[0];
    }
    catch (err) {
      log.error(err);
      return utils.error(err, 400);
    }

  }

  firstRow(data) {
    try {
      return data.rows[0];
    }
    catch (err) {
      log.error(err);
      return utils.error(err, 400);
    }
  }

  dictToArrayTimeserie(data) {
    var dt = [];
    _.each(data, function(every) {
      var obj = every.row;
      var d = {};
      d.time = obj.time;
      d.data = [];
      d.data.push({value: obj.data[0]||0});
      d.data.push({value: obj.data[1]||0});
      d.data.push({value: obj.data[2]||0});

      dt.push(d);
    });


    return dt;
  }

}

module.exports = BaseFormatter;
