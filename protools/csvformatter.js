'use strict';

var _ = require('underscore');
var utils = require('../utils');
var log = utils.log();
var json2csv = require('json2csv');
var BaseFormatter = require('./baseformatter');

class CSVFormatter extends BaseFormatter {

  constructor() {
    super();
  }

  formatTimeSerie(data) {

    var fields = ['time'];
    var first = true;

    data.forEach(function(ts) {
      for (var variable in ts.data) {
        var asVariable = ts.data[variable];
        if (asVariable instanceof Array) {
          for (var agg of asVariable) {
            var varname = `${variable}_${agg.agg}`;
            ts[varname] = agg.value
            if (first) fields.push(varname);
          }
        }
        else {
          ts[variable] = asVariable;
          if (first) fields.push(variable);
        }
      }
      if (first) first = false;

    });

    return json2csv({
      data: data,
      fields: fields,
      doubleQuotes: '',
      del: ';'});
  }

}

module.exports = CSVFormatter;
