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
