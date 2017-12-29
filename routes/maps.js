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

const express = require('express');
const MapsModel = require('../models/mapsmodel');
const utils = require('../utils.js');

const log = utils.log();
const responseValidator = utils.responseValidator;

let router = express.Router();

let entityValidator = function(req, res, next) {
  req.checkParams('entity', 'A required Urbo\'s entity ID').notEmpty();

  return next();
};

let filtersValidator = function(req, res, next) {
  req.checkBody('filters', 'A required Urbo\'s filters object').notEmpty();
  req.checkBody('filters.condition', 'The conditions, can be empty, of the filters object').notEmpty();
  req.checkBody('filters.bbox', 'An optional array with the bounding box').optional().isArray();

  return next();
};

let entityNowResponse = function(req, res, next) {
  let opts = req.opts || {};
  opts.scope = req.scope;
  opts.entity = req.params.entity;

  new MapsModel().entitiesNow(opts)
  .then(function(data) {
    res.json(data);
  })

  .catch(function(err) {
    next(utils.error(err, err.status));
  });
};

router.get('/:entity', entityValidator, entityNowResponse);

router.post('/:entity/now', entityValidator, filtersValidator,
  responseValidator, function(req, res, next) {
    req.opts = {
      filters: req.body.filters || {'condition': {}},
      bbox: req.body.filters ? req.body.filters.bbox : undefined
    };

    return next();
  }, entityNowResponse);

module.exports = router;
