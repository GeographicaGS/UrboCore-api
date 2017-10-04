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
