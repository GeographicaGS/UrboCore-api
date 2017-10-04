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
var auth = require('../auth.js');
var FramesModel = require('../models/framesmodel');

router.get('/', function (req, res, next) {
  var opts = {
    scope: req.scope
  };

  var model = new FramesModel();
  model.getFramesList(opts)
    .then(function (data) {
      res.json(data);
    })
    .catch(function (err) {
      next(err);
    });
});

router.get('/:id', function (req, res, next) {
  var opts = {
    id: req.params.id
  };

  var model = new FramesModel();
  model.getFrame(opts)
    .then(function (data) {
      res.json(data);
    })
    .catch(function (err) {
      next(err);
    });
});

router.post('/', auth.protectSuperAdmin, function (req, res, next) {
  var opts = req.body;

  var model = new FramesModel();
  model.createFrame(opts)
    .then(function (data) {
      res.status(201).send('null');
    })
    .catch(function (err) {
      next(err);
    });
});

router.put('/:id', auth.protectSuperAdmin, function (req, res, next) {
  var opts = req.body;
  opts.id = req.params.id;

  var model = new FramesModel();
  model.updateFrame(opts)
    .then(function () {
      res.status(204).send('null');
    })
    .catch(function (err) {
      next(err);
    });
});

router.delete('/:id', auth.protectSuperAdmin, function (req, res, next) {
  var opts = {
    id: req.params.id
  };

  var model = new FramesModel();
  model.deleteFrame(opts)
    .then(function () {
      res.status(204).end();
    })
    .catch(function (err) {
      next(err);
    });
});

module.exports = router;
