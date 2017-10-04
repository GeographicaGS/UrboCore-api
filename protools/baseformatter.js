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
