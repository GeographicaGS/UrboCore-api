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

var router = require('express').Router();
var jwt = require('jwt-simple');
var _ = require('underscore');
var utils = require('../utils');
var log = utils.log();
var utils = require('../utils');
var responseValidator = utils.responseValidator;
var Model = require('./model.js');

// WIDGET PUBLICATION

// router.get('/token/:token', function(req, res, next) {
//   var opts = {
//     token: req.params.token
//   }
//   new Model().getWidgetByToken(req.params.token)
//   .then((function(data){
//     return this.promiseRow(data);
//   }).bind(this))
//   .then(function(d){
//       let result = d.rows[0];
//       delete result.id;
//       res.status(200).json(result);
//   })
//   .catch(function(err){
//     var error = new Error(err);
//     error.status = 400;
//     return next(error);
//   })
// })


router.get('/:widget', function(req, res, next) {
  var opts = {
    scope: req.scope,
    widget: req.params.widget
  }
  new Model().getWidgetsByTypeAndScope(req.scope, req.params.widget)
  .then(function(d) {
    res.status(200).json(d.rows);
  })
  .catch(function(err) {
    var error = new Error(err);
    error.status = 400;
    return next(error);
  })
});



var publishValidator = function(req, res, next) {
  req.check('widget', 'id_widget required').notEmpty();
  req.checkBody('name', 'name required').notEmpty();
  req.checkBody('payload', 'payload required').notEmpty();
  return next();
}

router.post('/',
  publishValidator,
  responseValidator,
  function(req, res, next) {

    var host = req.headers['x-custom-host'] || (req.protocol + '://' + req.get('host'));
    var opts = {
      widget: req.body.widget,
      scope: req.scope,
      publish_name: req.body.name,
      description: req.body.description,
      payload: req.body.payload
    }

    opts.token = jwt.encode(opts.payload, req.app.get('jwtTokenSecret'));

    // Default metadata stuff
    opts.payload.push({
      url: host + '/scopes/' + req.scope + '?access_token_public=' + opts.token,
      data: {}
    })

    opts.payload.push({
      url: host + '/scopes?access_token_public=' + opts.token,
      data: {}
    })


    opts.payload.push({
      url: host + '/scopes/' + req.scope + '/metadata?access_token_public=' + opts.token,
      data: {}
    })

    opts.payload.push({
      url: host + '/metadata?access_token_public=' + opts.token,
      data: {}
    })



    new Model().publishWidget(opts)
    .then(function(data) {
      res.status(201).json(data.rows[0]);
    })
    .catch(function(err) {
      res.status(400).json(err);
    });
  });

var unpublishValidator = function(req, res, next) {
  req.check('id', 'id required').notEmpty();
  return next();
}

router.delete('/:id',
  unpublishValidator,
  responseValidator,
  function(req, res, next) {
    new Model().unpublishWidget(req.params.id)
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      res.status(400).json(err);
    });
  });



module.exports = router;