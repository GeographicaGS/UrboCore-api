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

var DummyFormatter = require('../protools/dummyformatter');
var express = require('express');
var IndicatorsModel = require('../models/indicatorsmodel');
var utils = require('../utils');

var router = express.Router();
var responseValidator = utils.responseValidator;

var dateValidator = function(req, res, next) {
  req.checkBody('time.start', 'required').notEmpty();
  return next();
}

router.post('', dateValidator, responseValidator, function(req, res, next) {
  var start = req.body.time.start.substring(0, 7) + '-01';

  var opts = {
    scope: req.scope,
    category: req.category,
    start: start,
    language: req.body.language || 'es'
  };

  var model = new IndicatorsModel();
  model.getIndicatorsList(opts)

  .then(function(data) {
    if (req.body.format === 'csv') {
      utils.json2csvWrapper({data: data, del: ';'}, function(err, csv) {
        if (err) {
          return next(err);
        }
        res.setHeader('Content-disposition', 'attachment; filename=indicators.csv');
        res.set('Content-Type', 'text/csv');
        res.send(new Buffer(csv));
      });

    } else {
      data = new DummyFormatter().pipe(data);
      res.json(data);
    }
  })

  .catch(function(err) {
    next(err);
  });
});

router.get('/periods', function(req, res, next) {
  var opts = {
    scope: req.scope,
    category: req.category
  };

  var model = new IndicatorsModel();
  model.getPeriodsList(opts)

  .then(function(data) {
    data = new DummyFormatter().pipe(data.periods);
    res.json(data);
  })

  .catch(function(err) {
    next(err);  // TODO: Think of returning a 404 if it fails
  });
});

router.post('/last', dateValidator, responseValidator, function(req, res, next) {
  var start = req.body.time.start.substring(0, 7) + '-01';

  var opts = {
    scope: req.scope,
    category: req.category,
    start: start,
    language: req.body.language || 'es',
    indicatorId: '0',
    last: true
  };

  var model = new IndicatorsModel();
  model.getIndicatorsList(opts)

  .then(function(data) {
    data = new DummyFormatter().pipe(data);
    res.json(data);
  })

  .catch(function(err) {
    next(err);
  });
});

router.post('/:id', dateValidator, responseValidator, function(req, res, next) {
  var start = req.body.time.start.substring(0, 7) + '-01';

  var opts = {
    scope: req.scope,
    category: req.category,
    start: start,
    language: req.body.language || 'es',
    indicatorId: req.params.id
  };

  var model = new IndicatorsModel();
  model.getIndicatorsList(opts)

  .then(function(data) {
    data = new DummyFormatter().pipe(data);
    res.json(data);
  })

  .catch(function(err) {
    next(err);
  });
});

module.exports = router;
