'use strict';

var _ = require('underscore');
var utils = require('../utils');
var log = utils.log();


module.exports = function(opts) {

  return (function(req, res, next) {
    // Promise trigger

    var params = {}
    for (var param in opts) {
      params[param] = eval(opts[param]);
    }

    var start = Promise.resolve(params);
    // Queue every promise from parent arguments
    for (var i=1;i<this.length;i++) {
      if (typeof this[i] === 'function') {
        start = start.then(this[i]);
      }
    }

    start
    .then(function(data) {
      res.json(data);
    })
    .catch(function(err) {
      log.error(err);
      res.status(400).json(err);
    })
  }).bind(arguments);
}
