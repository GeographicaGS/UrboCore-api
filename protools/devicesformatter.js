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
var moment = require('moment-timezone');
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

  parsedData(results, tz) {


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
    rslts.forEach(function(rsl) {
      rsl.time = moment.tz(rsl.time, tz).format('DD/MM/YYYY HH:mm');
    });
    return Promise.resolve(rslts);
  }

}

module.exports = DevicesFormatter;
