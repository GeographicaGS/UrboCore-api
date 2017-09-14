
'use strict';

var auth = require('../auth.js');
var express = require('express');
var router = express.Router();
var utils = require('../utils');
var log = utils.log();
var responseValidator = utils.responseValidator;
var LogsModel = require('../models/logsmodel');
var BaseFormatter = require('../protools/baseformatter');


var timeValidator = function(req, res, next) {
  req.checkQuery('start', 'date, required').notEmpty().isDate();
  req.checkQuery('finish', 'date, required').notEmpty().isDate();
  return next();
};

router.get('/pageviews/user/:id_user',
  timeValidator,
  responseValidator,
  auth.protectSuperAdmin,
  function(req, res, next) {

    var opts = {
      id_user: req.params.id_user,
      start: req.query.start,
      finish: req.query.finish
    }

    new LogsModel().getUserPageViews(opts)
    .then(new BaseFormatter().pipe)
    .then(function(data) { res.json(data) })
    .catch(function(err) {
      log.error(err);
      res.status(400).json(err);
    });
  });

router.get('/user/:id_user/lastlogin',
  responseValidator,
  auth.protectSuperAdmin,
  function(req, res, next) {

    new LogsModel().getUserLastLogin(req.params.id_user)
    .then(new BaseFormatter().firstRow)
    .then(function(data) { res.json(data) })
    .catch(function(err) {
      log.error(err);
      res.status(400).json(err);
    });
  });

router.get('/pageviews',
  timeValidator,
  responseValidator,
  auth.protectSuperAdmin,
  function(req, res, next) {

    var opts = {
      start: req.query.start,
      finish: req.query.finish
    }

    new LogsModel().getTotalPageViews(opts)
    .then(new BaseFormatter().pipe)
    .then(function(data) { res.json(data) })
    .catch(function(err) {
      log.error(err);
      res.status(400).json(err);
    });
  });

var storeLogsValidator = function(req, res, next) {

  //req.checkBody('user_ip', 'User IP required').notEmpty().isIP();
  //req.checkBody('time', 'Time required').notEmpty().isDate();
  req.checkBody('url', 'Url required').notEmpty();
  req.sanitize('url').trim();
  return next();
};

router.post('/pageviews',
  storeLogsValidator,
  responseValidator,
  function(req, res, next) {

    var opts = {
      id_user: res.user.id,
      url: req.body.url,
      user_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };

    new LogsModel().storeUserPageView(opts)
    .then(new BaseFormatter().firstRow)
    .then(function(results) {
      res.status(201).json({status: 'ok'})
    })
    .catch(function(err) {
      log.error(err);
      res.status(400).json(err);
    });
  });

module.exports = router;
