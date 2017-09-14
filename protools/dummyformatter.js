'use strict'
var Promised = require('./promised');
var utils = require('../utils');
var BaseFormatter = require('./baseformatter');
var log = utils.log();

class DummyFormatter extends BaseFormatter {
  constructor() {
    super();
  }
}

module.exports = DummyFormatter;
