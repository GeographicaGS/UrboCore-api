'use strict';

var _ = require('underscore');
var utils = require('../utils');
var log = utils.log();

function RankingFormatter() {
  return this;
}

RankingFormatter.prototype.formatTable = function(data) {
  var dt = [];
  _.each(data, function(row) {
    dt.push({
      id: row.row.id,
      kind: row.row.storedwastekind,
      id_entity: row.row.id_entity,
      lt__24: row.row.freqs.lt__24,
      lt__48: row.row.freqs.lt__48,
      lt__72: row.row.freqs.lt__72,
      gt__72: row.row.freqs.gt__72,
      efficiency: row.row.efficiency,
      inefficiency: row.row.inefficiency,
      synthetic: row.row.synthetic
    });
  });

  return Promise.resolve(dt);
};

RankingFormatter.prototype.percentage = function(data, key) {
  var total = 0;
  for (var pair of data) {
    total += Number(pair[key]);
  }

  for (var pair of data) {
    pair[key] = (pair[key] * 100) / total;
  }

  return Promise.resolve(data);
};

module.exports = RankingFormatter;
