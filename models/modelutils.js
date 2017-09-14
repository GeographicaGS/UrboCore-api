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
