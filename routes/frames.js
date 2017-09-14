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
