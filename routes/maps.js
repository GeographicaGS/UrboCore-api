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

const config = require('../config.js');
const express = require('express');
const MapsModel = require('../models/mapsmodel');
const utils = require('../utils.js');

const log = utils.log();
const responseValidator = utils.responseValidator;
const timesValidator = utils.timesValidator;

let router = express.Router();

var filtersValidator = function(req, res, next) {
  req.checkBody('filters', 'A required Urbo\'s filters object').notEmpty();
  req.checkBody('filters.condition', 'The conditions, can be empty, of the filters object').notEmpty();
  req.checkBody('filters.bbox', 'An optional array with the bounding box').optional().isArray();

  return next();
};

router.post('/:entity_id/now', filtersValidator, responseValidator,
    function(req, res, next) {
  var opts = {
    scope: req.scope,
    entity: req.params.entity_id,
    filters: req.body.filters || {'condition': {}},
    bbox: req.body.filters ? req.body.filters.bbox : undefined
  };

  new MapsModel().entitiesNow(opts)
  .then(function(data) {
    res.json(data);
  })
  .catch(function(err) {
    log.error(err);
    res.json(err);
  });
});

module.exports = router;
