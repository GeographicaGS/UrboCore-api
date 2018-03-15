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

var express = require('express');
var router = express.Router();
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

  var model = new EntitiesModel();
  model.getAllElementsByDevice(req.scope,req.params.id,function(err,r) {
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
  req.checkQuery('start', 'date, required').notEmpty().isDate();
  req.checkQuery('finish', 'date, required').notEmpty().isDate();

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

module.exports = router;
