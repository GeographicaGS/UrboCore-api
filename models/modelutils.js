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

var util = require('util');
var cons = require('../cons.js');
var utils = require('../utils');
var log = utils.log();

module.exports.wrapStrings = function(value,wrap) {
  if (wrap.length === 1)
    return [wrap[0],value,wrap[0]].join('')
  else if (wrap.length === 2)
    return [wrap[0],value,wrap[1]].join('')
  else {
    log.error('Wrap length must be 1 or 2');
    throw Error('Wrap length must be 1 or 2');
  }
}

module.exports.getSQLFormattedStep = function(step) {
  var tm_step;
  if (step === '30m') {
    tm_step = '30 minutes';
  } else if (step === '1h') {
    tm_step = '1 hours';
  } else if (step === '2h') {
    tm_step = '2 hours';
  } else if (step === '4h') {
    tm_step = '4 hours';
  } else if (step === '12h') {
    tm_step = '12 hours';
  } else if (step === '1d') {
    tm_step = '1 days';
  } else if (step === '2d') {
    tm_step = '2 days';
  } else if (step === '3d') {
    tm_step = '3 days';
  } else if (step === '7d') {
    tm_step = '7 days';
  } else {
    tm_step = '1 days';
  }
  return tm_step;
}
