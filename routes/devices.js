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
var DevicesModel = require('../models/devicesmodel');
var auth = require('../auth.js');
var responseValidator = utils.responseValidator;
var timesValidator = utils.timesValidator;

/*
* Get devices map by scope
*/
router.get('/map',
  auth.validateVariables('entities'),
  function(req, res, next) {

    var model = new DevicesModel();
    model.getDevicesMapByScope(req.scope,req.query.entities,res.user.id,function(err,r) {
      if (err) {
        log.error('Devices map: Error when selecting data');
        next(err);
      } else {
        res.json(r);
      }
    });
  });

/*
* Get mapentities
* Params: entities
* Example:
*   /mapentities?entities=watering.sosteco.sensor,watering.sosteco.solenoidvalve,watering.sosteco.watermetering
*/
router.get('/mapentities',
  auth.validateVariables('entities'),
  function(req, res, next) {
    var geojson = req.query.geojson || false;
    var model = new DevicesModel();
    model.getDevicesMapByEntity(req.scope,req.query.entities,geojson,res.user.id,function(err,r) {
      if (err) {
        log.error('Devices map entities: Error when selecting data');
        next(err);
      } else {
        res.json(r);
      }
    });
  });

function protectDevEntity(req,res,next) {
  var id_entity = req.query.deventity||req.params.id_entity||req.id_entity;
  auth.protect([id_entity])(req,res,next);
}

/*
* Get device lastdata
* Params: id_entity, id_device
* Example: /osuna/devices/watering.sosteco.weatherstation/watering.sosteco.weatherstation:es1/devinfo
*/
router.get('/:id_entity/:id_device/lastdata',
  protectDevEntity,
  function(req, res, next) {
    var model = new DevicesModel();
    var id_entity = req.params.id_entity;
    var id_device = req.params.id_device;

    if (!id_entity||!id_device)
      return next(utils.error('Bad parameters',400));

    model.getDeviceLastData(req.scope, id_entity,id_device,res.user.id,function(err,r) {
      if (err) {
        log.error('Device info: Error when selecting data');
        next(err);
      } else {
        res.json(r);
      }
    });
  });


/*
* Raw data of a device
*/
var getRawDataValidator = function(req, res, next) {
  req.checkBody('vars', 'array, required').notEmpty().isArray();
  req.checkBody('filters', 'required').optional().notEmpty();

  return next();
}

router.post('/:id_entity/:id_device/raw',
  getRawDataValidator,
  timesValidator,
  responseValidator,
  auth.validateVariables('vars'),
  function(req, res, next) {

    var opts = {
      scope: req.scope,
      id_device: req.params.id_device,
      id_entity: req.params.id_entity,
      start: req.body.time.start,
      finish: req.body.time.finish,
      id_vars: req.body.vars,
      filters: req.body.filters||{}
    };

    var model = new DevicesModel();
    model.getDevicesRawData(opts)
      .then(function(data) {
        res.json(data);
      })
      .catch(function(err) {
        next(err);
      });
  });

module.exports = router;
