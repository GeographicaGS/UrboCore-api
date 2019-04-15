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

var path = require('path');
var fs = require('fs');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../config');
var utils = require('../utils');
var log = utils.log();
var util = require('util');
var cons = require('../cons.js');
var EntitiesModel = require('../models/entitiesmodel');
var auth = require('../auth.js');

/*
* Get all the elements for a specific entity.
*/
router.get('/:id/elements',function(req, res, next) {
  var variables = req.query.variables ? req.query.variables.split(',') : [];
  var model = new EntitiesModel();
  model.getAllElementsByDevice(req.scope,req.params.id, variables, function(err,r) {
    if (err) {
      log.error('Get all elements by device: Error when selecting data');
      next(err);
    } else {
      res.json(r);
    }
  });
});

var counterValidator = function(req, res, next) {
  req.checkQuery('entities', 'required').notEmpty();
  req.checkQuery('start', 'date, required').optional().notEmpty().isDate();
  req.checkQuery('finish', 'date, required').optional().notEmpty().isDate();
  req.checkQuery('bbox', 'optional').optional().notEmpty();

  return next();
};


router.get('/map/counters', counterValidator, function(req, res, next) {
  var entities = req.query.entities;

  var opts = {
    start: req.query.start,
    finish: req.query.finish,
    entities: entities.split(','),
    bbox: req.query.bbox ? req.query.bbox.split(',') : null,
    scope: req.scope
  };

  var em = new EntitiesModel();
  em.mapCountersEntity(opts,function(err,r) {
    if (err)
      next(err);
    else {
      res.json(r);
    }
  });
});

/*
* Search a term inside all entities and placements.
*/
router.get('/search',auth.logged,function(req, res, next) {
  var entities = req.query.entities;

  if (!entities) {
    return next(utils.error('Bad parameters',400));
  }

  var opts = {
    scope: req.scope,
    entities: entities.split(','),
    term: req.query.term,
    limit: req.query.limit || 20
  }

  var model = new EntitiesModel();
  model.searchElements(opts,function(err,r) {
    if (err) {
      log.error('Search elements: Error when selecting data');
      next(err);
    } else {
      res.json(r);
    }
  });
});


var uploadCsv = multer({
  dest: path.join(__dirname, '../uploads/temp'),
  fileFilter: function (req, file, cb) {
    var filetype = /csv/;
    var mimetype = filetype.test(file.mimetype);
    var extname = filetype.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('Error: File upload only supports CSV filetype');
  }
});

function importOptionsValidator(req, res, next) {
  req.checkBody('options', 'required').notEmpty().custom(value => {
    try {
      var opts = JSON.parse(value);
      var errors = [];
      if (opts.fields == null || !Array.isArray(opts.fields) || opts.length === 0) // fields: required, array
        errors.push('Invalid options.fields');
      if (opts.delimiter == null || typeof opts.delimiter !== 'string') // delimiter: required, string
        errors.push('Invalid options.delimiter');
      if (opts.hasHeaders != null && typeof opts.hasHeaders !== 'boolean') // hasHeaders: optional, boolean
        errors.push('Invalid options.hasHeaders');
      if (errors.length > 0)
        throw new Error(errors);
    } catch(e) {
      fs.unlink(req.file.path); // remove uploaded file
      if (e instanceof SyntaxError)
        throw new Error('Invalid options')
      else 
        throw new Error(e);
    }
    return true;
  });
  return next();
};

/*
 * Import data from CSV file
 */
router.post('/:id/import/csv/', auth.logged, auth.protectSuperAdmin, uploadCsv.single('file'), importOptionsValidator,
  function(req, res, next){
    var params = JSON.parse(req.body.options);
    var model = new EntitiesModel();
    if (req.file) {
      return model.importFromCSV(req.scope, req.params.id, params.fields, req.file.path, params.delimiter, Boolean(params.hasHeaders), function(err) {
        fs.unlink(req.file.path);        
        if (err) {
          log.error('Import CSV: File import error');
          return next(err);
        } else {
          return res.status(200).json({success: 'ok'});
        }
      });
    }
    return next('Import CSV: Missing file');
  }
);

module.exports = router;
