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


router.get('/map/counters',function(req, res, next) {
  var entities = req.query.entities;

  if (!entities) {
    return next(utils.error('Bad parameters',400));
  }

  var opts = {
    entities: entities.split(','),
    bbox: req.query.bbox ? req.query.bbox.split(',') : null,
    scope: req.scope
  }

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
