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

var config = require('./config');
var logConstructor = require('log4js');
var json2csv = require('json2csv');

var _log = function() {
  var logParams = config.getLogOpt();
  return logConstructor.getLogger(logParams.output);
};

var log = _log();
module.exports.log = _log;

module.exports.error = function(msg,status){
  log.error(err);
  var err = new Error(msg);
  err.status = status || 500;
  return err;
}

module.exports.json2csvWrapper = function(opts, cb) {
  if (opts.data.length <= 0) {
    return cb(null, '');
  }

  json2csv(opts, function(err, csv) {
    if (err) {
      return cb(err);
    }

    return cb(null, csv);
  });
};

module.exports.timesValidator = function(req, res, next){
  // Sync validators
  req.checkBody('time.start', 'required').notEmpty();
  req.checkBody('time.finish', 'required').notEmpty();

  return next();
};

module.exports.responseValidator = function(req, res, next){
  var errors = req.validationErrors();
  if (errors) {
    log.error(errors);
    return res.status(400).json(errors);
  } else {
    return req.asyncValidationErrors()
    .then(function(){
      return next();

    })
    .catch(function(errors){
      log.error(errors);
      return res.status(400).json(errors);

    });
  }
};

module.exports.geomValidator = function(req, res, next) {
  req.checkBody('filters.the_geom["&&"]', 'Must be an array with 4 values').optional().isArray();
  req.checkBody('filters.the_geom.ST_Intersects', 'Must be a string or GeoJSON').optional().notEmpty();
  req.checkBody('filters.the_geom.id', 'Must be a valid id').optional().notEmpty();
  return next();
};
