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
var jwt = require('jwt-simple');
var utils = require('../utils');
var log = utils.log();
var moment = require('moment');
var check = require('./check');
var graph = require('./graph');
var Model = new require('./model.js');
var getPublicToken = require('./common').getPublicToken;


router.post('/token/new', check.password, function(req, res, next) {

  var expires = moment().add(req.app.get('jwtTokenExpiration'),'seconds').valueOf();

  var token = jwt.encode({
    iss: res.user.id,
    exp: expires
  }, req.app.get('jwtTokenSecret'));

  // store token at db
  var m = new Model();
  m.addToken({
    user: res.user.id,
    expires: expires,
    token: token
  }, function(err,data) {
    if (err) {
      return next(new Error('Cannot store token at db'));
    }

    graph.getUserGraph(res.user.id,function(err,data) {
      if (err)
        return next(err);
      res.json({
        token : token,
        expires: expires,
        user: res.user,
        graph: data
      });
    });

  });
});

router.get('/user/graph', check.checkToken, function(req, res, next) {

  graph.getUserGraph(res.user.id,function(err,data) {
    if (err)
      return next(err);
    res.json(data);
  });
});

module.exports = router;
